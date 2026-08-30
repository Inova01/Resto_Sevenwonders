/* =========================================================
   SEVEN WONDERS — content/settings.js
   ---------------------------------------------------------
   Restaurant identity, contact details, opening hours and
   social links. ONE place — every page's footer, the contact
   page, the reservation widget and the page titles all read
   from here.

   YOU DO NOT NEED TO EDIT THIS FILE BY HAND.
   Open  admin.html  →  "Info & Hours"  and press Publish.
   The dashboard rewrites this file for you.

   `verified` marks which values have been confirmed by the
   restaurant. Anything false shows an orange warning on the
   dashboard home until someone confirms it.
   ========================================================= */
window.SW_CONTENT = window.SW_CONTENT || {};

window.SW_CONTENT.settings = {
  brand: {
    /* The logo is drawn as two words: "Seven" + accent "Wonders" */
    first: "Seven",
    second: "Wonders",
    legalName: "Seven Wonders Restaurant & Bakery",
    shortName: "Seven Wonders"
  },

  tagline: "Authentic Haitian & Caribbean cuisine in Jacksonville",

  /* Footer paragraph under the logo, and the default meta description */
  blurb:
    "Authentic Haitian & Caribbean cuisine, fresh bakery favorites, and warm " +
    "Jacksonville hospitality.",

  contact: {
    address1: "2145 University Blvd N",
    address2: "Jacksonville, FL 32211",
    /* Human-readable phone, and the digits used for the tel: link */
    phone: "904 402 9212",
    phoneDigits: "+19044029212",
    email: "",
    /* Used to build the Google Maps embed on the contact page */
    mapQuery: "2145 University Blvd N, Jacksonville, FL 32211"
  },

  /* Opening hours, Monday first. Set closed:true to show "Closed".
     The reservation calendar disables any day marked closed. */
  hours: [
    { day: "Monday",    open: "8:00 AM", close: "9:00 PM", closed: false },
    { day: "Tuesday",   open: "8:00 AM", close: "9:00 PM", closed: false },
    { day: "Wednesday", open: "8:00 AM", close: "9:00 PM", closed: false },
    { day: "Thursday",  open: "8:00 AM", close: "9:00 PM", closed: false },
    { day: "Friday",    open: "8:00 AM", close: "10:00 PM", closed: false },
    { day: "Saturday",  open: "8:00 AM", close: "10:00 PM", closed: false },
    { day: "Sunday",    open: "8:00 AM", close: "6:00 PM", closed: false }
  ],
  hoursNote: "Special Menu Night — call ahead, fish and kabrit sell out.",

  /* Leave a social link empty ("") and its icon is hidden site-wide,
     instead of linking to "#" and going nowhere. */
  socials: {
    instagram: "",
    facebook: "",
    twitter: ""
  },

  forms: {
    /* Free key from https://web3forms.com — this is what makes
       reservations, orders and contact messages actually arrive
       in your inbox. While it is empty the site shows guests an
       honest "call us" message instead of a fake confirmation. */
    web3formsKey: "",
    /* Where the site tells guests to call when forms are offline */
    fallbackNote: "Please call us to confirm."
  },

  /* Confirmation checklist shown on the dashboard home.
     Flip to true from the dashboard once the manager confirms. */
  verified: {
    name: true,
    address: true,
    phone: true,
    email: false,
    hours: false,
    socials: false
  }
};
