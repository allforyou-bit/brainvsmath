/* ============================================================
   Brain vs Math — site configuration
   This is the ONLY file you need to touch to turn on revenue.
   ------------------------------------------------------------
   siteUrl          : canonical origin (no trailing slash)
   adsenseClient    : Google AdSense publisher id, e.g. "ca-pub-1234567890123456".
                      Leave "" until AdSense approves the site. When set, Auto Ads
                      load on every page automatically. Also update /ads.txt!
   cfAnalyticsToken : Cloudflare Web Analytics token (free, cookieless). Optional.
   ============================================================ */
window.BVM_CONFIG = {
  siteUrl: "https://brainvsmath.com",
  adsenseClient: "",
  cfAnalyticsToken: "",
  /* Shop checkout links — paste the product URLs from your store
     (Payhip/Gumroad/Ko-fi) and the buttons on /shop/ go live. */
  shop: {
    packUrl: "",
    bookUrl: "",
    kofiUrl: ""
  },
  /* Email capture (MailerLite). Both IDs are PUBLIC embed identifiers,
     not secrets. Create an embedded form in MailerLite, then paste:
       mlAccount : your account id (digits, e.g. "2520403")
       mlForm    : the form code (e.g. "a1b2C3")
     When both are set, the styled signup form on /free-multiplication-pack/
     goes live and captures emails. Until then, the page still gives the
     free download so it's useful immediately. */
  email: {
    mlAccount: "",
    mlForm: ""
  }
};
