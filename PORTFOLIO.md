# Portfolio interaction notes

This project is a portfolio website. It does not charge money, send orders or reserve real venue capacity.

The visit planner supports activity selection, illustrative capacity, discounts, local history, cancellation and CSV export. Capacity reflects this browser's saved plans only. Legacy simulation records remain readable.

## Validation

JavaScript syntax checks passed. Headless Chromium interaction checks covered saving a future visit, rendering history, cancelling a plan, hiding its ticket and persistence after reload. No page JavaScript errors occurred in those scenarios. 

Tests used local HTML/CSS/JavaScript with external media requests blocked. Full photo/video rendering and deployed-site behavior still require a final live check.

## Connecting real services later

Real orders, emails, authentication and shared venue availability require a backend. Keep local-only notices until actual delivery/booking confirmation is received from that service. Do not add real payment collection for this portfolio scope.
