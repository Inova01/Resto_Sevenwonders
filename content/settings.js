/* =========================================================
   SEVEN WONDERS — content/settings.js
   ---------------------------------------------------------
   Managed from admin.html. Anything you change here by hand
   will be overwritten the next time someone presses Publish
   in the dashboard.

   Field reference: ADMIN.md
   ========================================================= */
window.SW_CONTENT = window.SW_CONTENT || {};

window.SW_CONTENT.settings = {
  "brand": {
    "first": "Seven",
    "second": "Wonders",
    "legalName": "Seven Wonders Restaurant & Bakery",
    "shortName": "Seven Wonders"
  },
  "tagline": "Authentic Haitian & Caribbean cuisine in Jacksonville",
  "blurb": "Authentic Haitian & Caribbean cuisine, fresh bakery favorites, and warm Jacksonville hospitality.",
  "contact": {
    "address1": "2145 University Blvd N",
    "address2": "Jacksonville, FL 32211",
    "phone": "904 402 9212",
    "phoneDigits": "+19044029212",
    "email": "7wonderbc@gmail.com",
    "mapQuery": "2145 University Blvd N, Jacksonville, FL 32211"
  },
  "hours": [
    {
      "day": "Monday",
      "open": "9:00 AM",
      "close": "8:30 PM",
      "closed": false
    },
    {
      "day": "Tuesday",
      "open": "9:00 AM",
      "close": "8:30 PM",
      "closed": false
    },
    {
      "day": "Wednesday",
      "open": "9:00 AM",
      "close": "8:30 PM",
      "closed": false
    },
    {
      "day": "Thursday",
      "open": "9:00 AM",
      "close": "8:30 PM",
      "closed": false
    },
    {
      "day": "Friday",
      "open": "9:00 AM",
      "close": "9:00 PM",
      "closed": false
    },
    {
      "day": "Saturday",
      "open": "8:00 AM",
      "close": "9:00 PM",
      "closed": false
    },
    {
      "day": "Sunday",
      "open": "",
      "close": "",
      "closed": true
    }
  ],
  "hoursNote": "Special Menu Night — call ahead, fish and kabrit sell out.",
  "socials": {
    "instagram": "",
    "facebook": "",
    "twitter": ""
  },
  "forms": {
    "web3formsKey": "",
    "fallbackNote": "Please call us to confirm."
  },
  "verified": {
    "name": true,
    "address": true,
    "phone": true,
    "email": true,
    "hours": true,
    "socials": false
  }
};
