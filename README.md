# KyleAxity profile website

Single-screen responsive profile with Home, About, Skills, Games, Anime, and Socials tabs. Includes Sage & Cream and Moonlit Sage themes, typing roles, and rotating avatar artwork.

## Editing

- `dist/index.html`: profile, skills, game sections, and social links.
- `dist/style.css`: colors, text sizes, layout, and animations.
- `dist/script.js`: navigation, typing text, avatar rotation, and themes.
- `dist/mal.js`: MyAnimeList data, category views, and Jikan refresh integration.
- `dist/mal-snapshot.json`: verified public MAL profile snapshot collected November 13, 2026.
- `dist/assets/`: character artwork and game/anime cover images.

The portable ZIP places the website files at its top level. No build step is needed. Relative asset paths support repository-subdirectory hosting with GitHub Pages.

## Anime integration

The Anime tab immediately displays the verified public profile snapshot. It attempts to refresh public statistics, favorites, and recent updates through the unofficial Jikan v4 API:

- https://api.jikan.moe/v4/users/KyleAxity_/statistics
- https://api.jikan.moe/v4/users/KyleAxity_/favorites
- https://api.jikan.moe/v4/users/KyleAxity_/userupdates

Successful refreshes are cached in the visitor's browser for six hours. A failed or timed-out API request keeps the labeled snapshot visible. The curated shelves and favorite studios come from the saved public MAL profile and are labeled as a snapshot; Jikan does not supply these custom profile shelves. Refreshing the API does not rewrite the snapshot file.

The API service was unavailable from the authoring environment during validation. Snapshot rendering, paging, the failure fallback, and all three endpoint schemas were checked. Documentation: https://docs.api.jikan.moe/

## Avatar

The avatar rotates every 12 seconds and advances when clicked. Artwork is decoded before display; unavailable images are skipped. Adjust `roles` and `artwork` in the script to change the sequences.

The résumé file, street address, phone number, and personal email are not distributed with this website.

Character artwork, game artwork, and MAL cover art belong to their respective owners. No image rights are granted by this package.
