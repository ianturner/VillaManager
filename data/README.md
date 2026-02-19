# Prototype Data Layout

This folder contains JSON and asset data used by the prototype repositories.
The API serves files from this folder under `/data`.

## Structure
```
data/
  properties/
    <property_id>/
      data.json
      pages/
        <page>/
          images/
            ...
      pdfs/
        directions/
          ...
      poi/
        <poi_id>/
          data.json
          images/
            ...
          pdfs/
            ...
```

## Notes
- `data.json` mirrors the public DTO shape.
- Images and PDFs are discovered dynamically from their folders.
- Public URLs are built from the relative file path under `data/`.
