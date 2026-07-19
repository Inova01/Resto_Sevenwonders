/* =========================================================
   SEVEN WONDERS — reservation.js
   Single source of truth for the "Book A Table" form +
   availability calendar. Injected into any element with
   [data-reservation-widget], so reservation.html and the
   Reservation tab on menu.html stay perfectly in sync.

   The behaviour (calendar rendering, form submit) lives in
   main.js (initCalendar / initForms) and binds to this
   markup after it is injected.
   ========================================================= */
(function () {
  "use strict";

  const TEMPLATE = `
    <section class="section" style="padding-top:1rem">
      <div class="container reserve-grid">
        <!-- LEFT: form -->
        <div class="reveal">
          <p class="eyebrow">Online Reservation</p>
          <h2 class="section-title">Book A Table</h2>
          <p class="reserve-lead">Booking request <a href="tel:+19045550199">+1-904-555-0199</a> or fill out the reservation form below and we'll confirm within the hour.</p>

          <form data-web3form novalidate>
            <input type="hidden" name="access_key" value="PLACEHOLDER_WEB3FORMS_KEY" />
            <input type="hidden" name="subject" value="New Table Reservation — Seven Wonders" />
            <input type="hidden" name="from_name" value="Seven Wonders Website" />
            <input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off" />

            <div class="form-grid">
              <div class="form-status" role="status" aria-live="polite"></div>

              <div class="field">
                <label for="res-name">Your Name</label>
                <input id="res-name" name="name" type="text" placeholder="Jane Doe" required />
              </div>
              <div class="field">
                <label for="res-phone">Phone Number</label>
                <input id="res-phone" name="phone" type="tel" placeholder="+1 904 555 0199" required />
              </div>
              <div class="field">
                <label for="res-email">Email</label>
                <input id="res-email" name="email" type="email" placeholder="you@email.com" required />
              </div>
              <div class="field">
                <label for="res-guests">Number of Guests</label>
                <select id="res-guests" name="guests" required>
                  <option value="" disabled selected>Select…</option>
                  <option>1</option><option>2</option><option>3</option><option>4</option>
                  <option>5</option><option>6</option><option>7</option><option>8</option>
                  <option>9</option><option>10</option>
                </select>
              </div>
              <div class="field">
                <label for="res-date">Date</label>
                <input id="res-date" name="date" type="date" required />
              </div>
              <div class="field">
                <label for="res-time">Time</label>
                <select id="res-time" name="time" required>
                  <option value="" disabled selected>Select…</option>
                  <option>5:00 PM</option><option>5:30 PM</option><option>6:00 PM</option>
                  <option>6:30 PM</option><option>7:00 PM</option><option>7:30 PM</option>
                  <option>8:00 PM</option><option>8:30 PM</option><option>9:00 PM</option>
                </select>
              </div>
              <div class="field field--full">
                <label for="res-msg">Message</label>
                <textarea id="res-msg" name="message" placeholder="Allergies, celebrations, seating preferences…"></textarea>
              </div>
              <div class="field field--full">
                <button type="submit" class="btn btn--primary btn--block">Book A Table</button>
              </div>
            </div>
          </form>
        </div>

        <!-- RIGHT: photo -->
        <div class="reserve-photo reveal">
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80" alt="Warmly lit interior of Seven Wonders dining room" loading="lazy" />
        </div>
      </div>
    </section>

    <!-- AVAILABILITY CALENDAR -->
    <section class="section section--near" style="padding-top:1rem">
      <div class="container">
        <p class="eyebrow">Check Availability</p>
        <h2 class="section-title">This Month at Seven Wonders</h2>
        <div class="calendar" id="calendar">
          <div class="cal-head">
            <button class="cal-nav" id="cal-prev" type="button" aria-label="Previous month">‹</button>
            <span id="cal-title">Month Year</span>
            <button class="cal-nav" id="cal-next" type="button" aria-label="Next month">›</button>
          </div>
          <div class="cal-weekdays" aria-hidden="true">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
          <div class="cal-days" id="cal-days"></div>
        </div>
        <p style="color:var(--muted);font-size:.85rem;margin-top:1rem">Select a date above to auto-fill your reservation. Mondays we are closed.</p>
      </div>
    </section>`;

  // Inject synchronously (scripts sit at end of <body>, mount already parsed)
  // so main.js can bind its handlers to this markup on DOMContentLoaded.
  var mounts = document.querySelectorAll("[data-reservation-widget]");
  for (var i = 0; i < mounts.length; i++) {
    mounts[i].innerHTML = TEMPLATE;
  }
})();
