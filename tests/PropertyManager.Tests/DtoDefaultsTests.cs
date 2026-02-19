using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Requests;
using PropertyManager.Application.Contracts.Responses;
using Xunit;

namespace PropertyManager.Tests;

/// <summary>
/// Validates DTO default initialization for collections.
/// </summary>
public class DtoDefaultsTests
{
    [Fact]
    public void PropertyDto_Collections_AreInitialized()
    {
        var dto = new PropertyDto();

        Assert.NotNull(dto.Pages);
        Assert.NotNull(dto.ExternalLinks);
        Assert.NotNull(dto.Facilities);
        Assert.NotNull(dto.Pdfs);
    }

    [Fact]
    public void RentalDto_Collections_AreInitialized()
    {
        var dto = new RentalDto();

        Assert.NotNull(dto.Availability);
        Assert.NotNull(dto.Rates);
        Assert.NotNull(dto.Conditions);
    }

    [Fact]
    public void PoiDto_Collections_AreInitialized()
    {
        var dto = new PoiDto();

        Assert.NotNull(dto.Images);
        Assert.NotNull(dto.Pdfs);
    }

    [Fact]
    public void FinanceEntryDto_Collections_AreInitialized()
    {
        var dto = new FinanceEntryDto();

        Assert.NotNull(dto.Receipts);
    }

    [Fact]
    public void UploadResponseDto_Collections_AreInitialized()
    {
        var dto = new UploadResponseDto();

        Assert.NotNull(dto.Uploaded);
    }

    [Fact]
    public void MessageThreadDto_Collections_AreInitialized()
    {
        var dto = new MessageThreadDto();

        Assert.NotNull(dto.Messages);
    }
}
