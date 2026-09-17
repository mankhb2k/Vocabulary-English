# Open English WordNet 2025

This directory contains the JSON release of Open English WordNet 2025.

- Source: https://en-word.net/
- Release: 2025 edition
- Download: https://en-word.net/static/english-wordnet-2025-json.zip
- License: Open English WordNet is licensed under CC BY 4.0; the underlying Princeton WordNet license also applies. See https://github.com/globalwordnet/english-wordnet/blob/main/LICENSE.md

The dataset is kept outside Vite's `json/` public directory so it is not
automatically shipped as frontend assets. It can be imported into D1 or
processed into a compact lookup index for vocabulary validation.

`word-index.json` is the compact lookup index generated from the `entries-*.json`
files. It contains 127,311 normalized, unique headwords and is the preferred
file for checking whether an input exists in the dataset.
