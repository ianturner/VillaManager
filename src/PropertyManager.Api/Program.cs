using System;
using System.Collections.Generic;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PropertyManager.Api.Models;
using PropertyManager.Application;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Localization;
using PropertyManager.Application.Services.Repositories;
using PropertyManager.Infrastructure;
using PropertyManager.Infrastructure.Storage.Prototype;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddHttpClient();
builder.Services.Configure<FlightLookupOptions>(builder.Configuration.GetSection("Flights"));
builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.Converters.Add(new LocalizedStringJsonConverter());
});

var authOptions = builder.Configuration.GetSection("Auth").Get<AuthOptions>() ?? new AuthOptions();
if (string.IsNullOrWhiteSpace(authOptions.JwtKey))
{
    throw new InvalidOperationException("Auth.JwtKey configuration is required.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOptions.JwtKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateIssuer = true,
            ValidIssuer = authOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = authOptions.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
    options.AddPolicy("AdminOrOwner", policy => policy.RequireRole("admin", "property-owner"));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

var prototypeOptions = app.Configuration.GetSection("PrototypeData").Get<PrototypeDataOptions>()
    ?? new PrototypeDataOptions();
var prototypeRootPath = PrototypeDataPath.ResolveRootPath(prototypeOptions, app.Environment);
if (Directory.Exists(prototypeRootPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(prototypeRootPath),
        RequestPath = prototypeOptions.PublicBasePath
    });
}

var api = app.MapGroup("/api");

var auth = api.MapGroup("/auth");
auth.MapPost("/login", async (
        AuthLoginRequest request,
        IUserRepository userRepository,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.BadRequest(new { message = "Username and password are required." });
        }

        var user = await userRepository.GetByUsernameAsync(request.Username.Trim(), cancellationToken);
        if (user is null || !VerifyPassword(request.Password, user.PasswordSalt, user.PasswordHash))
        {
            return Results.Unauthorized();
        }
        if (user.Disabled)
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(authOptions.TokenLifetimeMinutes);
        var token = CreateJwtToken(user, authOptions, signingKey, expiresAt);

        var response = new AuthLoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new AuthUserInfo
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                Roles = user.Roles,
                PropertyIds = user.PropertyIds,
                PreferredLanguage = user.PreferredLanguage
            }
        };

        return Results.Ok(response);
    })
    .WithName("Login")
    .WithSummary("Authenticates a user and returns a JWT.");
auth.MapPost("/logout", () => Results.Ok(new { message = "Logged out." }))
    .WithName("Logout")
    .WithSummary("Logs out a user.");
auth.MapPost("/refresh", async (
        IUserRepository userRepository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        var username = GetUsername(user);
        if (string.IsNullOrWhiteSpace(username))
        {
            return Results.Unauthorized();
        }

        var currentUser = await userRepository.GetByUsernameAsync(username, cancellationToken);
        if (currentUser is null)
        {
            return Results.Unauthorized();
        }
        if (currentUser.Disabled)
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(authOptions.TokenLifetimeMinutes);
        var token = CreateJwtToken(currentUser, authOptions, signingKey, expiresAt);

        var response = new AuthLoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new AuthUserInfo
            {
                Id = currentUser.Id,
                Username = currentUser.Username,
                DisplayName = currentUser.DisplayName,
                Roles = currentUser.Roles,
                PropertyIds = currentUser.PropertyIds,
                PreferredLanguage = currentUser.PreferredLanguage
            }
        };

        return Results.Ok(response);
    })
    .RequireAuthorization()
    .WithName("RefreshSession")
    .WithSummary("Refreshes the current JWT session.");

var properties = api.MapGroup("/properties");
properties.MapGet("/{id}", async (
        string id,
        IPropertyRepository repository,
        HttpRequest request,
        CancellationToken cancellationToken) =>
    {
        var property = await repository.GetByIdAsync(id, cancellationToken);
        if (property is null || property.Archived)
        {
            return Results.NotFound();
        }

        var language = GetRequestedLanguage(request);
        // Include all languages so the client can switch language without refetching (e.g. Features section).
        var localized = LocalizeProperty(property, language, includeAllLanguages: true);
        var normalized = NormalizeProperty(localized, request);
        return Results.Ok(normalized);
    })
    .WithName("GetPropertyById")
    .WithSummary("Gets property details by identifier.");
properties.MapGet("/{id}/pages/{page}/images", async (
        string id,
        string page,
        IPropertyRepository repository,
        HttpRequest request,
        CancellationToken cancellationToken) =>
    {
        var property = await repository.GetByIdAsync(id, cancellationToken);
        if (property is null || property.Archived)
        {
            return Results.NotFound();
        }

        var images = await repository.GetPageImagesAsync(id, page, cancellationToken);
        var language = GetRequestedLanguage(request);
        var localizedImages = LocalizeImages(images, language, includeAllLanguages: false);
        var normalized = NormalizeImages(localizedImages, request);
        return Results.Ok(normalized);
    })
    .WithName("GetPropertyPageImages")
    .WithSummary("Gets images for a specific property page.");
properties.MapGet("/{id}/pages/{page}", async (
        string id,
        string page,
        IPropertyRepository repository,
        HttpRequest request,
        CancellationToken cancellationToken) =>
    {
        var property = await repository.GetByIdAsync(id, cancellationToken);
        if (property is null || property.Archived)
        {
            return Results.NotFound();
        }

        var language = GetRequestedLanguage(request);
        var localizedProperty = LocalizeProperty(property, language, includeAllLanguages: false);

        var key = page.Trim().ToLowerInvariant();
        var systemPage = key switch
        {
            "overview" => Results.Ok(new
            {
                page = "overview",
                data = new
                {
                    localizedProperty.Id,
                    localizedProperty.Name,
                    localizedProperty.Status,
                    localizedProperty.Summary,
                    HeroImages = NormalizeImages(localizedProperty.HeroImages, request)
                }
            }),
            "location" => Results.Ok(new
            {
                page = "location",
                data = localizedProperty.Location
            }),
            "facilities" => Results.Ok(new
            {
                page = "facilities",
                data = localizedProperty.Facilities
            }),
            "availability" => Results.Ok(new
            {
                page = "availability",
                data = localizedProperty.Rental is null
                    ? []
                    : NormalizeAvailability(localizedProperty.Rental.Availability, request)
            }),
            "rates" => Results.Ok(new
            {
                page = "rates",
                data = localizedProperty.Rental?.Rates ?? []
            }),
            "conditions" => Results.Ok(new
            {
                page = "conditions",
                data = localizedProperty.Rental?.Conditions ?? []
            }),
            "sales" => Results.Ok(new
            {
                page = "sales",
                data = NormalizeSalesParticulars(localizedProperty.SalesParticulars, request)
            }),
            _ => null
        };

        if (systemPage is not null)
        {
            return systemPage;
        }

        var matchedPage = localizedProperty.Pages
            .FirstOrDefault(candidate => candidate.Id.Equals(key, StringComparison.OrdinalIgnoreCase));
        if (matchedPage is null)
        {
            return Results.NotFound();
        }

        var normalizedPage = NormalizePages(new[] { matchedPage }, request).First();
        return Results.Ok(new
        {
            page = matchedPage.Id,
            data = normalizedPage
        });
    })
    .WithName("GetPropertyPageData")
    .WithSummary("Gets data for a specific property page.");
properties.MapGet("/{id}/pages", async (
        string id,
        IPropertyRepository repository,
        CancellationToken cancellationToken) =>
    {
        var property = await repository.GetByIdAsync(id, cancellationToken);
        if (property is null || property.Archived)
        {
            return Results.NotFound();
        }

        var pages = new List<PageInfo>
        {
            new("overview", 1)
        };

        var order = 2;
        foreach (var page in property.Pages)
        {
            if (string.IsNullOrWhiteSpace(page.Id))
            {
                continue;
            }

            pages.Add(new PageInfo(page.Id, order++));
        }

        pages.Add(new PageInfo("facilities", order++));
        pages.Add(new PageInfo("location", order++));
        pages.Add(new PageInfo("poi", order++));

        if (RentalUnitHelper.GetRentalUnits(property).Count > 0)
        {
            pages.Add(new PageInfo("availability", order++));
            pages.Add(new PageInfo("rates", order++));
            pages.Add(new PageInfo("conditions", order++));
        }

        if (property.SalesParticulars is not null)
        {
            pages.Add(new PageInfo("sales", order++));
        }

        return Results.Ok(pages.OrderBy(page => page.Order));
    })
    .WithName("GetPropertyPages")
    .WithSummary("Gets available pages for a property.");

var admin = api.MapGroup("/admin").RequireAuthorization();
admin.MapGet("/properties", async (
        IPropertyRepository repository,
        ClaimsPrincipal user,
        HttpRequest request,
        CancellationToken cancellationToken) =>
    {
        var propertiesList = await repository.GetAllLatestAsync(cancellationToken);
        var includeAllLanguages = ShouldIncludeAllLanguages(request);
        var language = GetRequestedLanguage(request);

        if (IsAdmin(user))
        {
            var ordered = propertiesList
                .OrderBy(property => property.Name.Resolve(language))
                .Select(property => LocalizeProperty(property, language, includeAllLanguages));
            return Results.Ok(ordered);
        }

        if (IsAgent(user) || IsPropertyManager(user) || IsPropertyOwner(user))
        {
            var propertyClaims = GetPropertyClaims(user);
            var filtered = propertiesList
                .Where(property => propertyClaims.Contains(property.Id))
                .OrderBy(property => property.Name.Resolve(language))
                .Select(property => LocalizeProperty(property, language, includeAllLanguages));
            return Results.Ok(filtered);
        }

        return Results.Forbid();
    })
    .WithName("AdminGetProperties")
    .WithSummary("Gets properties for admin management.");
admin.MapPost("/properties", async (
        PropertyManager.Application.Contracts.Requests.PropertyCreateRequestDto request,
        IPropertyRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        if (!IsAdmin(user) && !IsPropertyOwner(user) && !IsAgent(user))
        {
            return Results.Forbid();
        }
        var id = await repository.CreateAsync(request, cancellationToken);
        return Results.Created($"/api/admin/properties/{id}", new { id });
    })
    .WithName("AdminCreateProperty")
    .WithSummary("Creates a new property.");
admin.MapPut("/properties/{id}", async (
        string id,
        PropertyManager.Application.Contracts.Requests.PropertyUpdateRequestDto request,
        IPropertyRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        if (!IsAdmin(user))
        {
            if ((!IsAgent(user) && !IsPropertyOwner(user)) || !HasPropertyAccess(user, id))
            {
                return Results.Forbid();
            }
        }
        await repository.UpdateAsync(id, request, cancellationToken);
        return Results.NoContent();
    })
    .WithName("AdminUpdateProperty")
    .WithSummary("Updates an existing property.");
admin.MapGet("/properties/{id}/availability/ical", async (
        string id,
        HttpRequest request,
        IPropertyRepository repository,
        IHttpClientFactory httpClientFactory,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        if (!IsAdmin(user) && !HasPropertyAccess(user, id))
        {
            return Results.Forbid();
        }
        var property = await repository.GetLatestByIdAsync(id, cancellationToken);
        if (property is null || property.Archived)
        {
            return Results.NotFound();
        }

        var units = RentalUnitHelper.GetRentalUnits(property);
        var unitIndex = Math.Max(0, request.Query.TryGetValue("unitIndex", out var q) && int.TryParse(q, out var u) ? u : 0);
        var icalUrl = unitIndex < units.Count ? units[unitIndex].IcalUrl : null;
        if (string.IsNullOrWhiteSpace(icalUrl))
        {
            return Results.Ok(Array.Empty<IcalAvailabilityRangeDto>());
        }

        if (!Uri.TryCreate(icalUrl, UriKind.Absolute, out var icalUri)
            || (icalUri.Scheme != Uri.UriSchemeHttp && icalUri.Scheme != Uri.UriSchemeHttps))
        {
            return Results.BadRequest(new { message = "Invalid iCal URL." });
        }

        var client = httpClientFactory.CreateClient();
        var ics = await client.GetStringAsync(icalUri, cancellationToken);
        var ranges = ParseIcalAvailability(ics);
        return Results.Ok(ranges);
    })
    .WithName("AdminGetIcalAvailability")
    .WithSummary("Fetches blocked dates from an iCal feed.");
admin.MapPost("/properties/{id}/archive", async (
        string id,
        IPropertyRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        if (!IsAdmin(user))
        {
            if ((!IsAgent(user) && !IsPropertyOwner(user)) || !HasPropertyAccess(user, id))
            {
                return Results.Forbid();
            }
        }
        await repository.UpdateAsync(id, new PropertyManager.Application.Contracts.Requests.PropertyUpdateRequestDto
        {
            Archived = true
        }, cancellationToken);
        return Results.NoContent();
    })
    .WithName("AdminArchiveProperty")
    .WithSummary("Archives a property.");
admin.MapPost("/properties/{id}/restore", async (
        string id,
        IPropertyRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        if (!IsAdmin(user))
        {
            if ((!IsAgent(user) && !IsPropertyOwner(user)) || !HasPropertyAccess(user, id))
            {
                return Results.Forbid();
            }
        }
        await repository.UpdateAsync(id, new PropertyManager.Application.Contracts.Requests.PropertyUpdateRequestDto
        {
            Archived = false
        }, cancellationToken);
        return Results.NoContent();
    })
    .WithName("AdminRestoreProperty")
    .WithSummary("Restores an archived property.");
admin.MapPost("/properties/{id}/publish", async (
        string id,
        IPropertyRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        if (!IsAdmin(user))
        {
            if ((!IsAgent(user) && !IsPropertyOwner(user)) || !HasPropertyAccess(user, id))
            {
                return Results.Forbid();
            }
        }
        await repository.PublishAsync(id, cancellationToken);
        return Results.NoContent();
    })
    .WithName("AdminPublishProperty")
    .WithSummary("Publishes the latest draft for a property.");
admin.MapPost("/properties/{id}/revert", async (
        string id,
        IPropertyRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        if (!IsAdmin(user))
        {
            if ((!IsAgent(user) && !IsPropertyOwner(user)) || !HasPropertyAccess(user, id))
            {
                return Results.Forbid();
            }
        }
        await repository.RevertAsync(id, cancellationToken);
        return Results.NoContent();
    })
    .WithName("AdminRevertProperty")
    .WithSummary("Reverts the latest draft for a property.");
admin.MapGet("/flights/lookup", async (
        string flightNumber,
        string? date,
        string? airport,
        IOptions<FlightLookupOptions> options,
        IHttpClientFactory httpClientFactory,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(flightNumber))
        {
            return Results.BadRequest(new { message = "Flight number is required." });
        }

        var normalizedFlightNumber = Regex.Replace(flightNumber, "\\s+", string.Empty)
            .Trim()
            .ToUpperInvariant();

        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.ApiKey))
        {
            return Results.Json(
                new { message = "Flight lookup is not configured." },
                statusCode: StatusCodes.Status501NotImplemented);
        }

        var requestedDate = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        if (!string.IsNullOrWhiteSpace(date))
        {
            var trimmed = date.Trim();
            var formats = new[]
            {
                "yyyy-MM-dd",
                "dd/MM/yyyy",
                "d/M/yyyy",
                "MM/dd/yyyy",
                "M/d/yyyy"
            };
            if (DateTimeOffset.TryParseExact(
                    trimmed,
                    formats,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal,
                    out var parsedDate))
            {
                requestedDate = parsedDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            }
            else
            {
                requestedDate = trimmed;
            }
        }
        var baseUrl = string.IsNullOrWhiteSpace(settings.BaseUrl)
            ? "https://prod.api.market/api/v1/aedbx/aerodatabox"
            : settings.BaseUrl.TrimEnd('/');
        var url =
            $"{baseUrl}/flights/number/{Uri.EscapeDataString(normalizedFlightNumber)}/{requestedDate}?dateLocalRole=Both";

        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Remove(settings.ApiKeyHeader);
        client.DefaultRequestHeaders.Add(settings.ApiKeyHeader, settings.ApiKey);
        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(
            new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
        var response = await client.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorPayload = await response.Content.ReadAsStringAsync(cancellationToken);
            return Results.Json(
                new
                {
                    message = "Flight provider did not respond successfully.",
                    status = (int)response.StatusCode,
                    details = string.IsNullOrWhiteSpace(errorPayload) ? null : errorPayload
                },
                statusCode: StatusCodes.Status502BadGateway);
        }

        var payload = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(payload);
        var dataElement = document.RootElement;
        if (dataElement.ValueKind == JsonValueKind.Object
            && dataElement.TryGetProperty("data", out var wrappedData))
        {
            dataElement = wrappedData;
        }
        if (dataElement.ValueKind != JsonValueKind.Array)
        {
            return Results.NotFound(new
            {
                message = "No flights found.",
                details = payload
            });
        }

        var airportValue = airport?.Trim();
        var airportCode = airportValue;
        if (!string.IsNullOrWhiteSpace(airportValue))
        {
            var normalizedAirport = airportValue.Trim().ToLowerInvariant();
            var knownAirportCodes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["heraklion"] = "HER",
                ["herklion"] = "HER",
                ["heraklion airport"] = "HER",
                ["nikos kazantzakis"] = "HER",
                ["chania"] = "CHQ",
                ["chania airport"] = "CHQ",
                ["ioannis daskalogiannis"] = "CHQ"
            };
            foreach (var entry in knownAirportCodes)
            {
                if (normalizedAirport.Contains(entry.Key, StringComparison.OrdinalIgnoreCase))
                {
                    airportCode = entry.Value;
                    break;
                }
            }
        }
        var entries = dataElement.EnumerateArray().ToList();
        foreach (var entry in entries)
        {
            if (!entry.TryGetProperty("arrival", out var arrival))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(airportValue))
            {
                string? arrivalName = null;
                string? arrivalIata = null;
                string? arrivalIcao = null;
                if (arrival.TryGetProperty("airport", out var airportElement))
                {
                    if (airportElement.ValueKind == JsonValueKind.Object)
                    {
                        arrivalName = airportElement.TryGetProperty("name", out var nameElement)
                            ? nameElement.GetString()
                            : null;
                        arrivalIata = airportElement.TryGetProperty("iata", out var iataElement)
                            ? iataElement.GetString()
                            : null;
                        arrivalIcao = airportElement.TryGetProperty("icao", out var icaoElement)
                            ? icaoElement.GetString()
                            : null;
                    }
                    else if (airportElement.ValueKind == JsonValueKind.String)
                    {
                        arrivalName = airportElement.GetString();
                    }
                }
                var airportMatches =
                    (!string.IsNullOrWhiteSpace(arrivalIata)
                        && !string.IsNullOrWhiteSpace(airportCode)
                        && airportCode.Length <= 3
                        && string.Equals(arrivalIata, airportCode, StringComparison.OrdinalIgnoreCase))
                    || (!string.IsNullOrWhiteSpace(arrivalIcao)
                        && !string.IsNullOrWhiteSpace(airportCode)
                        && airportCode.Length <= 4
                        && string.Equals(arrivalIcao, airportCode, StringComparison.OrdinalIgnoreCase))
                    || (!string.IsNullOrWhiteSpace(arrivalIata)
                        && airportValue.Contains(arrivalIata, StringComparison.OrdinalIgnoreCase))
                    || (!string.IsNullOrWhiteSpace(arrivalIcao)
                        && airportValue.Contains(arrivalIcao, StringComparison.OrdinalIgnoreCase))
                    || (!string.IsNullOrWhiteSpace(arrivalName)
                        && arrivalName.Contains(airportValue, StringComparison.OrdinalIgnoreCase));
                if (!airportMatches)
                {
                    continue;
                }
            }

            string? timeValue = null;
            if (arrival.TryGetProperty("actualTimeLocal", out var actualElement))
            {
                timeValue = GetTimeString(actualElement);
            }
            if (string.IsNullOrWhiteSpace(timeValue)
                && arrival.TryGetProperty("estimatedTimeLocal", out var estimatedElement))
            {
                timeValue = GetTimeString(estimatedElement);
            }
            if (string.IsNullOrWhiteSpace(timeValue)
                && arrival.TryGetProperty("scheduledTimeLocal", out var scheduledElement))
            {
                timeValue = GetTimeString(scheduledElement);
            }
            if (string.IsNullOrWhiteSpace(timeValue)
                && arrival.TryGetProperty("actualTimeUtc", out var actualUtcElement))
            {
                timeValue = GetTimeString(actualUtcElement);
            }
            if (string.IsNullOrWhiteSpace(timeValue)
                && arrival.TryGetProperty("estimatedTimeUtc", out var estimatedUtcElement))
            {
                timeValue = GetTimeString(estimatedUtcElement);
            }
            if (string.IsNullOrWhiteSpace(timeValue)
                && arrival.TryGetProperty("scheduledTimeUtc", out var scheduledUtcElement))
            {
                timeValue = GetTimeString(scheduledUtcElement);
            }
            if (string.IsNullOrWhiteSpace(timeValue)
                && arrival.TryGetProperty("actualTime", out var actualLegacyElement))
            {
                timeValue = GetTimeString(actualLegacyElement);
            }
            if (string.IsNullOrWhiteSpace(timeValue)
                && arrival.TryGetProperty("estimatedTime", out var estimatedLegacyElement))
            {
                timeValue = GetTimeString(estimatedLegacyElement);
            }
            if (string.IsNullOrWhiteSpace(timeValue)
                && arrival.TryGetProperty("scheduledTime", out var scheduledLegacyElement))
            {
                timeValue = GetTimeString(scheduledLegacyElement);
            }
            if (string.IsNullOrWhiteSpace(timeValue))
            {
                continue;
            }

            if (!DateTimeOffset.TryParse(timeValue, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsedTime))
            {
                continue;
            }

            var formatted = parsedTime.ToString("hh:mm tt", CultureInfo.InvariantCulture).ToLowerInvariant();
            return Results.Ok(new
            {
                arrivalTime = formatted,
                raw = timeValue,
                flightNumber = normalizedFlightNumber,
                date = requestedDate
            });
        }
        if (!string.IsNullOrWhiteSpace(airportValue))
        {
            foreach (var entry in entries)
            {
                if (!entry.TryGetProperty("arrival", out var arrival))
                {
                    continue;
                }

                string? timeValue = null;
                if (arrival.TryGetProperty("actualTimeLocal", out var actualElement))
                {
                    timeValue = GetTimeString(actualElement);
                }
                if (string.IsNullOrWhiteSpace(timeValue)
                    && arrival.TryGetProperty("estimatedTimeLocal", out var estimatedElement))
                {
                    timeValue = GetTimeString(estimatedElement);
                }
                if (string.IsNullOrWhiteSpace(timeValue)
                    && arrival.TryGetProperty("scheduledTimeLocal", out var scheduledElement))
                {
                    timeValue = GetTimeString(scheduledElement);
                }
                if (string.IsNullOrWhiteSpace(timeValue)
                    && arrival.TryGetProperty("actualTime", out var actualLegacyElement))
                {
                    timeValue = GetTimeString(actualLegacyElement);
                }
                if (string.IsNullOrWhiteSpace(timeValue)
                    && arrival.TryGetProperty("estimatedTime", out var estimatedLegacyElement))
                {
                    timeValue = GetTimeString(estimatedLegacyElement);
                }
                if (string.IsNullOrWhiteSpace(timeValue)
                    && arrival.TryGetProperty("scheduledTime", out var scheduledLegacyElement))
                {
                    timeValue = GetTimeString(scheduledLegacyElement);
                }
                if (string.IsNullOrWhiteSpace(timeValue))
                {
                    continue;
                }

                if (!DateTimeOffset.TryParse(
                        timeValue,
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.RoundtripKind,
                        out var parsedTime))
                {
                    continue;
                }

                var formatted = parsedTime.ToString("hh:mm tt", CultureInfo.InvariantCulture).ToLowerInvariant();
                return Results.Ok(new
                {
                    arrivalTime = formatted,
                    raw = timeValue,
                flightNumber = normalizedFlightNumber,
                    date = requestedDate
                });
            }
        }

        var airports = entries
            .Select(entry =>
            {
                if (!entry.TryGetProperty("arrival", out var arrival))
                {
                    return null;
                }
                if (arrival.TryGetProperty("airport", out var airportElement))
                {
                    if (airportElement.ValueKind == JsonValueKind.Object)
                    {
                        return airportElement.TryGetProperty("iata", out var iataElement)
                            ? iataElement.GetString()
                            : airportElement.TryGetProperty("name", out var nameElement)
                                ? nameElement.GetString()
                                : null;
                    }
                    if (airportElement.ValueKind == JsonValueKind.String)
                    {
                        return airportElement.GetString();
                    }
                }
                return null;
            })
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var flightNumbers = entries
            .Select(entry =>
            {
                if (entry.TryGetProperty("number", out var numberElement))
                {
                    if (numberElement.ValueKind == JsonValueKind.String)
                    {
                        return numberElement.GetString();
                    }
                    if (numberElement.ValueKind == JsonValueKind.Object
                        && numberElement.TryGetProperty("iata", out var iataElement))
                    {
                        return iataElement.GetString();
                    }
                }
                return null;
            })
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return Results.NotFound(new
        {
            message = "No matching arrival time found.",
            candidates = airports.Length > 0 ? airports : null,
            flightNumbers = flightNumbers.Length > 0 ? flightNumbers : null,
            date = requestedDate
        });
    })
    .WithName("AdminLookupFlightArrival")
    .WithSummary("Looks up a flight arrival time by flight number.");

var themes = api.MapGroup("/themes").RequireAuthorization();
themes.MapGet("", async (
        IThemeRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        var username = GetUsername(user);
        var isAdmin = IsAdmin(user);
        var allThemes = await repository.GetAllAsync(cancellationToken);
        var filtered = isAdmin
            ? allThemes
            : allThemes.Where(theme =>
                !theme.IsPrivate
                || (!string.IsNullOrWhiteSpace(username)
                    && string.Equals(theme.CreatedBy, username, StringComparison.OrdinalIgnoreCase)));

        return Results.Ok(filtered.OrderBy(theme => theme.DisplayName, StringComparer.OrdinalIgnoreCase));
    })
    .WithName("GetThemes")
    .WithSummary("Gets shared themes available to the current user.");
themes.MapPost("", async (
        ThemeCreateRequest request,
        IThemeRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.DisplayName))
        {
            return Results.BadRequest(new { message = "Theme name and display name are required." });
        }

        var existing = await repository.GetByNameAsync(request.Name.Trim(), cancellationToken);
        if (existing is not null)
        {
            return Results.BadRequest(new { message = "Theme name already exists." });
        }

        var username = GetUsername(user);
        var isAdmin = IsAdmin(user);
        if (!isAdmin && !request.IsPrivate)
        {
            return Results.Forbid();
        }

        var theme = new ThemeLibraryDto
        {
            Name = request.Name.Trim(),
            DisplayName = request.DisplayName.Trim(),
            IsPrivate = request.IsPrivate || !isAdmin,
            CreatedBy = request.IsPrivate || !isAdmin ? username : null,
            DefaultMode = request.DefaultMode,
            Light = request.Light,
            Dark = request.Dark,
            Fonts = request.Fonts,
            HeadingSizes = request.HeadingSizes,
            HeadingTransforms = request.HeadingTransforms,
            BodyTextSize = request.BodyTextSize,
            CornerRadius = request.CornerRadius
        };

        await repository.CreateAsync(theme, cancellationToken);
        return Results.Created($"/api/themes/{theme.Name}", theme);
    })
    .WithName("CreateTheme")
    .WithSummary("Creates a new theme.");
themes.MapPut("/{name}", async (
        string name,
        ThemeUpdateRequest request,
        IThemeRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        var existing = await repository.GetByNameAsync(name, cancellationToken);
        if (existing is null)
        {
            return Results.NotFound();
        }

        var username = GetUsername(user);
        var isAdmin = IsAdmin(user);
        if (!isAdmin)
        {
            if (!existing.IsPrivate
                || string.IsNullOrWhiteSpace(username)
                || !string.Equals(existing.CreatedBy, username, StringComparison.OrdinalIgnoreCase))
            {
                return Results.Forbid();
            }
        }

        var updated = existing with
        {
            DisplayName = request.DisplayName?.Trim() ?? existing.DisplayName,
            DefaultMode = request.DefaultMode ?? existing.DefaultMode,
            Light = request.Light ?? existing.Light,
            Dark = request.Dark ?? existing.Dark,
            Fonts = request.Fonts ?? existing.Fonts,
            HeadingSizes = request.HeadingSizes ?? existing.HeadingSizes,
            HeadingTransforms = request.HeadingTransforms ?? existing.HeadingTransforms,
            BodyTextSize = request.BodyTextSize ?? existing.BodyTextSize,
            CornerRadius = request.CornerRadius ?? existing.CornerRadius,
            IsPrivate = isAdmin ? request.IsPrivate ?? existing.IsPrivate : existing.IsPrivate,
            CreatedBy = isAdmin ? request.CreatedBy ?? existing.CreatedBy : existing.CreatedBy
        };

        await repository.UpdateAsync(updated, cancellationToken);
        return Results.Ok(updated);
    })
    .WithName("UpdateTheme")
    .WithSummary("Updates an existing theme.");
themes.MapDelete("/{name}", async (
        string name,
        IThemeRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        var existing = await repository.GetByNameAsync(name, cancellationToken);
        if (existing is null)
        {
            return Results.NotFound();
        }

        if (!IsAdmin(user))
        {
            return Results.Forbid();
        }

        await repository.DeleteAsync(name, cancellationToken);
        return Results.NoContent();
    })
    .WithName("DeleteTheme")
    .WithSummary("Deletes a theme.");

var userAdmin = api.MapGroup("/admin/users").RequireAuthorization("AdminOrOwner");
userAdmin.MapGet("", async (
        IUserRepository userRepository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        var users = await userRepository.GetAllAsync(cancellationToken);
        var isAdmin = IsAdmin(user);
        var propertyClaims = GetPropertyClaims(user);

        var filtered = isAdmin
            ? users
            : users.Where(candidate =>
                !IsAdminUser(candidate)
                && candidate.PropertyIds.All(propertyClaims.Contains)).ToList();

        var response = filtered.Select(MapUserSummary)
            .OrderBy(candidate => candidate.Username, StringComparer.OrdinalIgnoreCase);
        return Results.Ok(response);
    })
    .WithName("AdminGetUsers")
    .WithSummary("Gets users for administration.");
userAdmin.MapGet("/properties", async (
        IPropertyRepository repository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        var propertiesList = await repository.GetAllLatestAsync(cancellationToken);
        var isAdmin = IsAdmin(user);
        var propertyClaims = GetPropertyClaims(user);

        var filtered = propertiesList
            .Where(property => !property.Archived)
            .Where(property => isAdmin || propertyClaims.Contains(property.Id))
            .OrderBy(property => property.Name.Resolve(LanguageCodes.Default))
            .Select(property => new PropertySummaryDto
            {
                Id = property.Id,
                Name = property.Name.Resolve(LanguageCodes.Default)
            });

        return Results.Ok(filtered);
    })
    .WithName("AdminGetUserProperties")
    .WithSummary("Gets properties available for user access assignment.");
userAdmin.MapPost("", async (
        UserCreateRequest request,
        IUserRepository userRepository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.BadRequest(new { message = "Username and password are required." });
        }

        var existing = await userRepository.GetByUsernameAsync(request.Username.Trim(), cancellationToken);
        if (existing is not null)
        {
            return Results.BadRequest(new { message = "Username already exists." });
        }

        if (!IsAdmin(user))
        {
            if (HasAdminRole(request.Roles))
            {
                return Results.Forbid();
            }
            var propertyClaims = GetPropertyClaims(user);
            if (request.PropertyIds.Any(id => !propertyClaims.Contains(id)))
            {
                return Results.Forbid();
            }
        }

        var (salt, hash) = CreatePasswordHash(request.Password);
        var newUser = new PropertyManager.Application.Contracts.UserCredentialDto
        {
            Id = Guid.NewGuid().ToString("D"),
            Username = request.Username.Trim(),
            DisplayName = request.DisplayName.Trim(),
            Roles = request.Roles ?? new List<string>(),
            PropertyIds = request.PropertyIds ?? new List<string>(),
            Email = request.Email,
            Phone = request.Phone,
            WhatsApp = request.WhatsApp,
            Viber = request.Viber,
            PreferredLanguage = request.PreferredLanguage,
            PasswordSalt = salt,
            PasswordHash = hash,
            Disabled = request.Disabled
        };

        await userRepository.CreateAsync(newUser, cancellationToken);
        return Results.Created($"/api/admin/users/{newUser.Id}", MapUserSummary(newUser));
    })
    .WithName("AdminCreateUser")
    .WithSummary("Creates a new user.");
userAdmin.MapPut("/{id}", async (
        string id,
        UserUpdateRequest request,
        IUserRepository userRepository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        var existing = await userRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return Results.NotFound();
        }

        if (!IsAdmin(user) && IsAdminUser(existing))
        {
            return Results.Forbid();
        }

        var updatedRoles = request.Roles ?? existing.Roles;
        var updatedPropertyIds = request.PropertyIds ?? existing.PropertyIds;
        var updatedUsername = request.Username?.Trim() ?? existing.Username;
        var updatedDisplayName = request.DisplayName?.Trim() ?? existing.DisplayName;
        var updatedDisabled = request.Disabled ?? existing.Disabled;
        var updatedEmail = request.Email ?? existing.Email;
        var updatedPhone = request.Phone ?? existing.Phone;
        var updatedWhatsApp = request.WhatsApp ?? existing.WhatsApp;
        var updatedViber = request.Viber ?? existing.Viber;
        var updatedPreferredLanguage = request.PreferredLanguage ?? existing.PreferredLanguage;

        if (!IsAdmin(user))
        {
            if (HasAdminRole(updatedRoles))
            {
                return Results.Forbid();
            }
            var propertyClaims = GetPropertyClaims(user);
            if (updatedPropertyIds.Any(idValue => !propertyClaims.Contains(idValue)))
            {
                return Results.Forbid();
            }
        }

        var usernameOwner = await userRepository.GetByUsernameAsync(updatedUsername, cancellationToken);
        if (usernameOwner is not null && usernameOwner.Id != existing.Id)
        {
            return Results.BadRequest(new { message = "Username already exists." });
        }

        var passwordSalt = existing.PasswordSalt;
        var passwordHash = existing.PasswordHash;
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var credentials = CreatePasswordHash(request.Password);
            passwordSalt = credentials.Salt;
            passwordHash = credentials.Hash;
        }

        var updated = existing with
        {
            Username = updatedUsername,
            DisplayName = updatedDisplayName,
            Roles = updatedRoles,
            PropertyIds = updatedPropertyIds,
            Email = updatedEmail,
            Phone = updatedPhone,
            WhatsApp = updatedWhatsApp,
            Viber = updatedViber,
            PreferredLanguage = updatedPreferredLanguage,
            PasswordSalt = passwordSalt,
            PasswordHash = passwordHash,
            Disabled = updatedDisabled
        };

        await userRepository.UpdateAsync(updated, cancellationToken);
        return Results.Ok(MapUserSummary(updated));
    })
    .WithName("AdminUpdateUser")
    .WithSummary("Updates an existing user.");
userAdmin.MapDelete("/{id}", async (
        string id,
        IUserRepository userRepository,
        ClaimsPrincipal user,
        CancellationToken cancellationToken) =>
    {
        var existing = await userRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return Results.NotFound();
        }

        if (IsAdminUser(existing))
        {
            return Results.BadRequest(new { message = "Admin user cannot be deleted." });
        }

        if (!IsAdmin(user))
        {
            var propertyClaims = GetPropertyClaims(user);
            if (existing.PropertyIds.Any(idValue => !propertyClaims.Contains(idValue)))
            {
                return Results.Forbid();
            }
        }

        await userRepository.DeleteAsync(id, cancellationToken);
        return Results.NoContent();
    })
    .WithName("AdminDeleteUser")
    .WithSummary("Deletes a user.");
properties.MapGet("/{id}/poi", async (
        string id,
        IPropertyRepository propertyRepository,
        IPoiRepository repository,
        HttpRequest request,
        CancellationToken cancellationToken) =>
    {
        var property = await propertyRepository.GetByIdAsync(id, cancellationToken);
        if (property is null || property.Archived)
        {
            return Results.NotFound();
        }

        var pois = await repository.GetByPropertyIdAsync(id, cancellationToken);
        var normalized = NormalizePois(pois, request);
        return Results.Ok(normalized);
    })
    .WithName("GetPropertyPois")
    .WithSummary("Gets POIs for a property.");
properties.MapGet("/{id}/poi/{poiId}/images", async (
        string id,
        string poiId,
        IPropertyRepository propertyRepository,
        IPoiRepository repository,
        HttpRequest request,
        CancellationToken cancellationToken) =>
    {
        var property = await propertyRepository.GetByIdAsync(id, cancellationToken);
        if (property is null || property.Archived)
        {
            return Results.NotFound();
        }

        var images = await repository.GetPoiImagesAsync(id, poiId, cancellationToken);
        var normalized = NormalizeImages(images, request);
        return Results.Ok(normalized);
    })
    .WithName("GetPropertyPoiImages")
    .WithSummary("Gets images for a property POI.");
properties.MapGet("/{id}/pdfs", async (
        string id,
        IPropertyRepository repository,
        HttpRequest request,
        CancellationToken cancellationToken) =>
    {
        var pdfs = await repository.GetPropertyPdfsAsync(id, cancellationToken);
        var normalized = NormalizePdfs(pdfs, request);
        return Results.Ok(normalized);
    })
    .WithName("GetPropertyPdfs")
    .WithSummary("Gets PDFs for a property.");
properties.MapGet("/{id}/poi/{poiId}/pdfs", async (
        string id,
        string poiId,
        IPoiRepository repository,
        HttpRequest request,
        CancellationToken cancellationToken) =>
    {
        var pdfs = await repository.GetPoiPdfsAsync(id, poiId, cancellationToken);
        var normalized = NormalizePdfs(pdfs, request);
        return Results.Ok(normalized);
    })
    .WithName("GetPropertyPoiPdfs")
    .WithSummary("Gets PDFs for a property POI.");

api.MapPost("/messages", (PropertyManager.Application.Contracts.Requests.MessageCreateRequestDto _) =>
    Results.StatusCode(StatusCodes.Status501NotImplemented))
    .WithName("CreateMessage")
    .WithSummary("Creates a message and returns thread identifiers.");
api.MapGet("/messages/thread/{threadId}", (string threadId) =>
    Results.StatusCode(StatusCodes.Status501NotImplemented))
    .WithName("GetMessageThread")
    .WithSummary("Gets a message thread by identifier.");
api.MapGet("/notifications", () => Results.StatusCode(StatusCodes.Status501NotImplemented))
    .WithName("GetNotifications")
    .WithSummary("Gets notifications for the current user.");

var finance = api.MapGroup("/finance");
finance.MapPost("/{propertyId}/entries", (string propertyId, PropertyManager.Application.Contracts.Requests.FinanceEntryCreateRequestDto _) =>
    Results.StatusCode(StatusCodes.Status501NotImplemented))
    .WithName("CreateFinanceEntry")
    .WithSummary("Creates a finance entry for a property.");
finance.MapGet("/{propertyId}/entries", (string propertyId) =>
    Results.StatusCode(StatusCodes.Status501NotImplemented))
    .WithName("GetFinanceEntries")
    .WithSummary("Gets finance entries for a property.");
finance.MapPost("/{propertyId}/entries/{entryId}/receipts", (string propertyId, string entryId) =>
    Results.StatusCode(StatusCodes.Status501NotImplemented))
    .WithName("UploadFinanceReceipts")
    .WithSummary("Uploads receipts for a finance entry.");

api.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("HealthCheck")
    .WithSummary("Health check endpoint.");

app.Run();

static string CreateJwtToken(
    PropertyManager.Application.Contracts.UserCredentialDto user,
    AuthOptions options,
    SymmetricSecurityKey signingKey,
    DateTimeOffset expiresAt)
{
    var claims = new List<Claim>
    {
        new(JwtRegisteredClaimNames.Sub, user.Id),
        new(JwtRegisteredClaimNames.UniqueName, user.Username),
        new("display_name", user.DisplayName)
    };

    claims.AddRange(user.Roles.Select(role => new Claim(ClaimTypes.Role, role)));
    claims.AddRange(user.PropertyIds.Select(propertyId => new Claim("property", propertyId)));

    var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
    var token = new JwtSecurityToken(
        issuer: options.Issuer,
        audience: options.Audience,
        claims: claims,
        expires: expiresAt.UtcDateTime,
        signingCredentials: credentials);

    return new JwtSecurityTokenHandler().WriteToken(token);
}

static bool VerifyPassword(string password, string saltBase64, string hashBase64)
{
    if (string.IsNullOrWhiteSpace(password)
        || string.IsNullOrWhiteSpace(saltBase64)
        || string.IsNullOrWhiteSpace(hashBase64))
    {
        return false;
    }

    var salt = Convert.FromBase64String(saltBase64);
    var expectedHash = Convert.FromBase64String(hashBase64);

    using var deriveBytes = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
    var actualHash = deriveBytes.GetBytes(expectedHash.Length);

    return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
}

static (string Salt, string Hash) CreatePasswordHash(string password)
{
    var salt = RandomNumberGenerator.GetBytes(16);
    using var deriveBytes = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
    var hash = deriveBytes.GetBytes(32);
    return (Convert.ToBase64String(salt), Convert.ToBase64String(hash));
}

static bool IsAdmin(ClaimsPrincipal user) => user.IsInRole("admin");
static bool IsAgent(ClaimsPrincipal user) => user.IsInRole("agent");
static bool IsPropertyManager(ClaimsPrincipal user) => user.IsInRole("property-manager");
static bool IsPropertyOwner(ClaimsPrincipal user)
    => user.IsInRole("property-owner")
        || user.IsInRole("property_owner")
        || user.IsInRole("propertyowner")
        || user.IsInRole("owner");

static string? GetUsername(ClaimsPrincipal user)
    => user.Claims.FirstOrDefault(claim =>
            claim.Type == JwtRegisteredClaimNames.UniqueName || claim.Type == ClaimTypes.Name)
        ?.Value;

static bool HasAdminRole(IEnumerable<string> roles)
    => roles.Any(role => string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase));

static bool IsAdminUser(PropertyManager.Application.Contracts.UserCredentialDto user)
    => HasAdminRole(user.Roles);

static HashSet<string> GetPropertyClaims(ClaimsPrincipal user)
    => user.Claims
        .Where(claim => claim.Type == "property")
        .Select(claim => claim.Value)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

static bool HasPropertyAccess(ClaimsPrincipal user, string propertyId)
    => GetPropertyClaims(user).Contains(propertyId);

static UserManagementDto MapUserSummary(PropertyManager.Application.Contracts.UserCredentialDto user)
    => new()
    {
        Id = user.Id,
        Username = user.Username,
        DisplayName = user.DisplayName,
        Roles = user.Roles,
        PropertyIds = user.PropertyIds,
        Email = user.Email,
        Phone = user.Phone,
        WhatsApp = user.WhatsApp,
        Viber = user.Viber,
        Disabled = user.Disabled,
        PreferredLanguage = user.PreferredLanguage
    };

static string GetRequestedLanguage(HttpRequest request)
{
    if (request.Query.TryGetValue("lang", out var value))
    {
        return LanguageCodes.Normalize(value.FirstOrDefault());
    }

    return LanguageCodes.Default;
}

static bool ShouldIncludeAllLanguages(HttpRequest request)
{
    if (!request.Query.TryGetValue("includeAllLanguages", out var value))
    {
        return false;
    }

    return bool.TryParse(value.FirstOrDefault(), out var result) && result;
}

static PropertyManager.Application.Contracts.Localization.LocalizedString Localize(
    PropertyManager.Application.Contracts.Localization.LocalizedString value,
    string language)
    => PropertyManager.Application.Contracts.Localization.LocalizedString.FromString(value.Resolve(language));

static PropertyManager.Application.Contracts.Localization.LocalizedString? LocalizeOptional(
    PropertyManager.Application.Contracts.Localization.LocalizedString? value,
    string language)
    => value is null ? null : Localize(value, language);

static PropertyManager.Application.Contracts.Localization.LocalizedString EnsureAllLanguages(
    PropertyManager.Application.Contracts.Localization.LocalizedString value)
{
    var translations = PropertyManager.Application.Contracts.Localization.LanguageCodes.Supported
        .ToDictionary(
            code => code,
            code => value.Resolve(code),
            StringComparer.OrdinalIgnoreCase);

    return PropertyManager.Application.Contracts.Localization.LocalizedString.FromTranslations(translations);
}

static PropertyManager.Application.Contracts.Localization.LocalizedString? EnsureAllLanguagesOptional(
    PropertyManager.Application.Contracts.Localization.LocalizedString? value)
    => value is null ? null : EnsureAllLanguages(value);

static List<PropertyManager.Application.Contracts.ImageDto> LocalizeImages(
    IEnumerable<PropertyManager.Application.Contracts.ImageDto> images,
    string language,
    bool includeAllLanguages)
{
    if (includeAllLanguages)
    {
        return images
            .Select(image => image with
            {
                Alt = EnsureAllLanguagesOptional(image.Alt)
            })
            .ToList();
    }

    return images
        .Select(image => image with
        {
            Alt = LocalizeOptional(image.Alt, language)
        })
        .ToList();
}

static List<PropertyManager.Application.Contracts.PropertySectionDto> LocalizeSections(
    IEnumerable<PropertyManager.Application.Contracts.PropertySectionDto> sections,
    string language,
    bool includeAllLanguages)
{
    return sections
        .Select(section => section with
        {
            Title = includeAllLanguages
                ? EnsureAllLanguagesOptional(section.Title)
                : LocalizeOptional(section.Title, language),
            Description = includeAllLanguages
                ? EnsureAllLanguagesOptional(section.Description)
                : LocalizeOptional(section.Description, language),
            HeroText = includeAllLanguages
                ? EnsureAllLanguagesOptional(section.HeroText)
                : LocalizeOptional(section.HeroText, language),
            HeroImages = LocalizeImages(section.HeroImages, language, includeAllLanguages),
            Images = LocalizeImages(section.Images, language, includeAllLanguages)
        })
        .ToList();
}

static List<PropertyManager.Application.Contracts.PropertyPageDto> LocalizePages(
    IEnumerable<PropertyManager.Application.Contracts.PropertyPageDto> pages,
    string language,
    bool includeAllLanguages)
{
    return pages
        .Select(page => page with
        {
            Title = includeAllLanguages
                ? EnsureAllLanguages(page.Title)
                : Localize(page.Title, language),
            HeroText = includeAllLanguages
                ? EnsureAllLanguagesOptional(page.HeroText)
                : LocalizeOptional(page.HeroText, language),
            HeroImages = LocalizeImages(page.HeroImages, language, includeAllLanguages),
            Sections = LocalizeSections(page.Sections, language, includeAllLanguages)
        })
        .ToList();
}

static List<PropertyManager.Application.Contracts.PropertyExperienceItemDto> LocalizeExperienceItems(
    IEnumerable<PropertyManager.Application.Contracts.PropertyExperienceItemDto> items,
    string language,
    bool includeAllLanguages)
{
    return items
        .Select(item => item with
        {
            Category = includeAllLanguages
                ? EnsureAllLanguagesOptional(item.Category)
                : LocalizeOptional(item.Category, language),
            Heading = includeAllLanguages
                ? EnsureAllLanguagesOptional(item.Heading)
                : LocalizeOptional(item.Heading, language),
            ItemText = includeAllLanguages
                ? EnsureAllLanguagesOptional(item.ItemText)
                : LocalizeOptional(item.ItemText, language),
            HeroImages = LocalizeImages(item.HeroImages, language, includeAllLanguages),
            GalleryImages = LocalizeImages(item.GalleryImages, language, includeAllLanguages),
            Links = item.Links
                .Select(link => link with
                {
                    Label = includeAllLanguages
                        ? EnsureAllLanguagesOptional(link.Label)
                        : LocalizeOptional(link.Label, language)
                })
                .ToList()
        })
        .ToList();
}

static PropertyManager.Application.Contracts.PropertyPlacesPageDto? LocalizePlacesPage(
    PropertyManager.Application.Contracts.PropertyPlacesPageDto? page,
    string language,
    bool includeAllLanguages)
{
    if (page is null)
    {
        return null;
    }

    return page with
    {
        PageTitle = includeAllLanguages
            ? EnsureAllLanguages(page.PageTitle)
            : Localize(page.PageTitle, language),
        Description = includeAllLanguages
            ? EnsureAllLanguagesOptional(page.Description)
            : LocalizeOptional(page.Description, language),
        Sections = page.Sections
            .Select(section => section with
            {
                Title = includeAllLanguages
                    ? EnsureAllLanguages(section.Title)
                    : Localize(section.Title, language),
                Description = includeAllLanguages
                    ? EnsureAllLanguagesOptional(section.Description)
                    : LocalizeOptional(section.Description, language)
            })
            .ToList(),
        Items = LocalizeExperienceItems(page.Items, language, includeAllLanguages)
    };
}

static PropertyManager.Application.Contracts.PropertyDto LocalizeProperty(
    PropertyManager.Application.Contracts.PropertyDto property,
    string language,
    bool includeAllLanguages)
{
    if (includeAllLanguages)
    {
        return property with
        {
            Name = EnsureAllLanguages(property.Name),
            Summary = EnsureAllLanguagesOptional(property.Summary),
            HeroImages = LocalizeImages(property.HeroImages, language, includeAllLanguages),
            Pages = LocalizePages(property.Pages, language, includeAllLanguages),
            Places = LocalizePlacesPage(property.Places, language, includeAllLanguages),
            ExternalLinks = property.ExternalLinks
                .Select(link => link with { Label = EnsureAllLanguagesOptional(link.Label) })
                .ToList(),
            Location = property.Location is null
                ? null
                : property.Location with
                {
                    Address = EnsureAllLanguages(property.Location.Address),
                    Description = EnsureAllLanguagesOptional(property.Location.Description)
                },
            Facilities = property.Facilities
                .Select(group => group with
                {
                    Title = EnsureAllLanguages(group.Title),
                    Items = group.Items
                        .Select(item => item with { Text = EnsureAllLanguages(item.Text) })
                        .ToList()
                })
                .ToList(),
            Pdfs = property.Pdfs
                .Select(pdf => pdf with { Title = EnsureAllLanguages(pdf.Title) })
                .ToList()
        };
    }

    return property with
    {
        Name = Localize(property.Name, language),
        Summary = LocalizeOptional(property.Summary, language),
        HeroImages = LocalizeImages(property.HeroImages, language, includeAllLanguages),
        Pages = LocalizePages(property.Pages, language, includeAllLanguages),
        Places = LocalizePlacesPage(property.Places, language, includeAllLanguages),
        ExternalLinks = property.ExternalLinks
            .Select(link => link with { Label = LocalizeOptional(link.Label, language) })
            .ToList(),
        Location = property.Location is null
            ? null
            : property.Location with
            {
                Address = Localize(property.Location.Address, language),
                Description = LocalizeOptional(property.Location.Description, language)
            },
        Facilities = property.Facilities
            .Select(group => group with
            {
                Title = Localize(group.Title, language),
                Items = group.Items
                    .Select(item => item with { Text = Localize(item.Text, language) })
                    .ToList()
            })
            .ToList(),
        Pdfs = property.Pdfs
            .Select(pdf => pdf with { Title = Localize(pdf.Title, language) })
            .ToList()
    };
}

static PropertyManager.Application.Contracts.PropertyDto NormalizeProperty(
    PropertyManager.Application.Contracts.PropertyDto property,
    HttpRequest request)
{
    var heroImages = NormalizeImagesForProperty(property.HeroImages, request, property.Id);
    var pages = NormalizePages(property.Pages, request);
    var places = NormalizePlacesPage(property.Places, request);
    var pdfs = NormalizePdfs(property.Pdfs, request);

    var salesParticulars = NormalizeSalesParticulars(property.SalesParticulars, request);

    var units = RentalUnitHelper.GetRentalUnits(property);
    var normalizedUnits = units
        .Select(unit => unit with
        {
            Availability = unit.Availability
                .Select(availability => availability.CalendarImage is null
                    ? availability
                    : availability with
                    {
                        CalendarImage = NormalizeImage(availability.CalendarImage, request)
                    })
                .ToList()
        })
        .ToList();
    var rental = normalizedUnits.Count > 0 ? normalizedUnits[0] : null;

    var listingLanguages = property.ListingLanguages is { Count: > 0 }
        ? property.ListingLanguages
        : new List<string> { "en", "fr", "de", "el" };

    return property with
    {
        HeroImages = heroImages,
        Pages = pages,
        Places = places,
        Pdfs = pdfs,
        SalesParticulars = salesParticulars,
        Rental = rental,
        RentalUnits = normalizedUnits,
        ListingLanguages = listingLanguages
    };
}

static PropertyManager.Application.Contracts.ImageDto? NormalizeImage(
    PropertyManager.Application.Contracts.ImageDto? image,
    HttpRequest request)
{
    return image is null ? null : image with { Src = ToAbsoluteUrl(request, image.Src) };
}

static List<PropertyManager.Application.Contracts.PropertySectionDto> NormalizeSections(
    IEnumerable<PropertyManager.Application.Contracts.PropertySectionDto> sections,
    HttpRequest request)
{
    return sections
        .Select(section => section with
        {
            Images = NormalizeImages(section.Images, request)
        })
        .ToList();
}

static List<PropertyManager.Application.Contracts.RentalAvailabilityDto> NormalizeAvailability(
    IEnumerable<PropertyManager.Application.Contracts.RentalAvailabilityDto> availability,
    HttpRequest request)
{
    return availability
        .Select(item => item.CalendarImage is null
            ? item
            : item with
            {
                CalendarImage = NormalizeImage(item.CalendarImage, request)
            })
        .ToList();
}

static string? GetTimeString(JsonElement element)
{
    if (element.ValueKind == JsonValueKind.String)
    {
        return element.GetString();
    }

    if (element.ValueKind == JsonValueKind.Object)
    {
        if (element.TryGetProperty("local", out var localElement)
            && localElement.ValueKind == JsonValueKind.String)
        {
            return localElement.GetString();
        }

        if (element.TryGetProperty("utc", out var utcElement)
            && utcElement.ValueKind == JsonValueKind.String)
        {
            return utcElement.GetString();
        }
    }

    return null;
}

static List<PropertyManager.Application.Contracts.PropertyPageDto> NormalizePages(
    IEnumerable<PropertyManager.Application.Contracts.PropertyPageDto> pages,
    HttpRequest request)
{
    return pages
        .Select(page => page with
        {
            HeroImages = NormalizeImages(page.HeroImages, request),
            Sections = NormalizeSections(page.Sections, request)
        })
        .ToList();
}

static PropertyManager.Application.Contracts.PropertyPlacesPageDto? NormalizePlacesPage(
    PropertyManager.Application.Contracts.PropertyPlacesPageDto? page,
    HttpRequest request)
{
    if (page is null)
    {
        return null;
    }

    return page with
    {
        Items = page.Items
            .Select(item => item with
            {
                HeroImages = NormalizeImages(item.HeroImages, request),
                GalleryImages = NormalizeImages(item.GalleryImages, request)
            })
            .ToList()
    };
}

static List<PropertyManager.Application.Contracts.ImageDto> NormalizeImages(
    IEnumerable<PropertyManager.Application.Contracts.ImageDto> images,
    HttpRequest request)
{
    return images
        .Select(image => image with { Src = ToAbsoluteUrl(request, image.Src) })
        .ToList();
}

static List<PropertyManager.Application.Contracts.PdfDto> NormalizePdfs(
    IEnumerable<PropertyManager.Application.Contracts.PdfDto> pdfs,
    HttpRequest request)
{
    return pdfs
        .Select(pdf => pdf with { Src = ToAbsoluteUrl(request, pdf.Src) })
        .ToList();
}

static List<PropertyManager.Application.Contracts.PoiDto> NormalizePois(
    IEnumerable<PropertyManager.Application.Contracts.PoiDto> pois,
    HttpRequest request)
{
    return pois
        .Select(poi => poi with
        {
            Images = NormalizeImages(poi.Images, request),
            Pdfs = NormalizePdfs(poi.Pdfs, request)
        })
        .ToList();
}

static List<IcalAvailabilityRangeDto> ParseIcalAvailability(string ics)
{
    var lines = UnfoldIcalLines(ics);
    var ranges = new List<IcalAvailabilityRangeDto>();
    DateOnly? start = null;
    DateOnly? end = null;
    bool endIsDateOnly = false;
    string? summary = null;
    var inEvent = false;

    foreach (var rawLine in lines)
    {
        if (rawLine == "BEGIN:VEVENT")
        {
            inEvent = true;
            start = null;
            end = null;
            endIsDateOnly = false;
            summary = null;
            continue;
        }

        if (rawLine == "END:VEVENT")
        {
            if (start is not null)
            {
                var endDate = end ?? start.Value;
                if (endIsDateOnly && endDate > start.Value)
                {
                    endDate = endDate.AddDays(-1);
                }

                ranges.Add(new IcalAvailabilityRangeDto
                {
                    Start = start.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    End = endDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    Summary = summary
                });
            }

            inEvent = false;
            continue;
        }

        if (!inEvent)
        {
            continue;
        }

        if (rawLine.StartsWith("DTSTART", StringComparison.OrdinalIgnoreCase))
        {
            if (TryParseIcalDate(rawLine, out var date, out _))
            {
                start = date;
            }
            continue;
        }

        if (rawLine.StartsWith("DTEND", StringComparison.OrdinalIgnoreCase))
        {
            if (TryParseIcalDate(rawLine, out var date, out var isDateOnly))
            {
                end = date;
                endIsDateOnly = isDateOnly;
            }
            continue;
        }

        if (rawLine.StartsWith("SUMMARY", StringComparison.OrdinalIgnoreCase))
        {
            summary = ExtractIcalValue(rawLine);
        }
    }

    return ranges
        .OrderBy(range => range.Start, StringComparer.Ordinal)
        .ToList();
}

static List<string> UnfoldIcalLines(string ics)
{
    var lines = ics.Replace("\r\n", "\n").Split('\n');
    var result = new List<string>();

    foreach (var line in lines)
    {
        if (line.StartsWith(" ") || line.StartsWith("\t"))
        {
            if (result.Count > 0)
            {
                result[result.Count - 1] += line.TrimStart();
            }
            continue;
        }

        if (!string.IsNullOrWhiteSpace(line))
        {
            result.Add(line.TrimEnd());
        }
    }

    return result;
}

static bool TryParseIcalDate(string line, out DateOnly date, out bool isDateOnly)
{
    isDateOnly = false;
    date = default;

    var value = ExtractIcalValue(line);
    if (string.IsNullOrWhiteSpace(value))
    {
        return false;
    }

    if (value.Length == 8 && value.All(char.IsDigit))
    {
        if (DateOnly.TryParseExact(value, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
        {
            isDateOnly = true;
            return true;
        }
    }

    if (DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed))
    {
        date = DateOnly.FromDateTime(parsed.UtcDateTime);
        return true;
    }

    return false;
}

static string ExtractIcalValue(string line)
{
    var index = line.IndexOf(':');
    return index < 0 ? string.Empty : line[(index + 1)..].Trim();
}

static PropertyManager.Application.Contracts.SalesParticularsDto? NormalizeSalesParticulars(
    PropertyManager.Application.Contracts.SalesParticularsDto? salesParticulars,
    HttpRequest request)
{
    return salesParticulars is null
        ? null
        : salesParticulars with
        {
            Documents = salesParticulars.Documents
                .Select(document => ToAbsoluteUrl(request, document))
                .ToList()
        };
}

static string ToAbsoluteUrl(HttpRequest request, string src)
{
    if (string.IsNullOrWhiteSpace(src))
    {
        return src;
    }

    if (Uri.TryCreate(src, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
    {
        return src;
    }

    var baseUrl = $"{request.Scheme}://{request.Host}";
    var path = src.StartsWith('/') ? src : "/" + src;
    return baseUrl + path;
}

/// <summary>
/// Builds absolute URLs for property-level assets (e.g. hero images) so they include
/// /data/properties/{propertyId}/ and are served from the correct folder.
/// </summary>
static string ToPropertyAssetUrl(HttpRequest request, string propertyId, string src)
{
    if (string.IsNullOrWhiteSpace(src))
    {
        return src;
    }

    if (Uri.TryCreate(src, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
    {
        return src;
    }

    var baseUrl = $"{request.Scheme}://{request.Host}";
    var path = src.TrimStart('/');
    return baseUrl + "/data/properties/" + propertyId + "/" + path;
}

static List<PropertyManager.Application.Contracts.ImageDto> NormalizeImagesForProperty(
    IEnumerable<PropertyManager.Application.Contracts.ImageDto> images,
    HttpRequest request,
    string propertyId)
{
    return images
        .Select(image => image with { Src = ToPropertyAssetUrl(request, propertyId, image.Src) })
        .ToList();
}
