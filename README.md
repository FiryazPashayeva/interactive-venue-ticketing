# Grand Pink Palace - Interactive Venue Ticketing

WM1 student project: a front-end ticket-selection page for a theatre-style venue (HTML, CSS, JavaScript, no backend).

## Venue
- 3 zones, 200 seats: VIP Princess (rows A-C, 120 AZN), Royal Sweet (rows D-G, 80 AZN), Fairy Balcony (rows H-L, 45 AZN)
- Seats are generated from the `SECTIONS` configuration in `app.js`

## Features
- Seat click only inspects (details and price); ADD TO CART adds the ticket
- Seat states: available, inspected, in cart, unavailable
- Zoom in/out, move up/down/left/right, reset view
- Cart with total, removal, duplicate prevention, map and cart kept in sync
- Cart saved to localStorage (seat IDs) and restored after refresh
- Responsive layout
- Bonus: mouse-wheel zoom and click/drag panning

## Run
Open `index.html` in a browser.
