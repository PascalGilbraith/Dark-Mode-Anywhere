# Changelog

## [1.0.1]
- Fix: media inside shadow DOM video players (web components) is no longer inverted
- Fix: players that attach their shadow root late, or nest media in inner shadow roots or background images, are detected

## [1.0.0]
- Dark mode for any page via CSS inversion (images/video preserved)
- Popup toggles: per-site and global default, remembered across sessions
- Dependency-free build script (`npm run build`) and package checks (`npm test`)
