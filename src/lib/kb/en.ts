import type { KbLocale, KbText } from "./types";

// Platform steps: menu names change often. Verify against each platform before launch.
const titleFixes: KbText["platformFixes"] = {
  wordpress:
    "Install a free SEO plugin such as Yoast SEO or Rank Math. Edit your homepage, scroll to the plugin's box below the editor, and fill in \"SEO title\". Click Update.",
  wix: "In the editor, open Pages & Menu, click the ⋯ next to your homepage, choose SEO basics, and edit \"Title tag\". Publish your site.",
  shopify: "In your Shopify admin, go to Online Store › Preferences, fill in \"Homepage title\", and click Save.",
  squarespace:
    "Open Pages, hover over your homepage and click the gear icon. In the SEO tab, fill in \"SEO title\" and save.",
  webflow:
    "In the Designer, open the Pages panel, hover over Home and click the gear icon. Under SEO settings, fill in \"Title tag\", then publish.",
};

const descriptionFixes: KbText["platformFixes"] = {
  wordpress:
    "With Yoast SEO or Rank Math installed, edit your homepage, scroll to the plugin's box below the editor, and fill in \"Meta description\". Click Update.",
  wix: "In the editor, open Pages & Menu, click the ⋯ next to your homepage, choose SEO basics, and edit \"Meta description\". Publish your site.",
  shopify: "In your Shopify admin, go to Online Store › Preferences, fill in \"Homepage meta description\", and click Save.",
  squarespace:
    "Open Pages, hover over your homepage and click the gear icon. In the SEO tab, fill in \"SEO description\" and save.",
  webflow:
    "In the Designer, open the Pages panel, hover over Home and click the gear icon. Under SEO settings, fill in \"Meta description\", then publish.",
};

export const en = {
  "seo.title.missing": {
    title: "Your page has no title for search results",
    what: "Your homepage doesn't give search engines a page title: the blue headline people click in Google.",
    why: "Without one, Google makes up a headline from your page, and it is often a poor one.",
    businessImpact: "Fewer people click through to your site from Google.",
    fix: "Add a short title that says what you do and where, for example \"Rosa's Bakery: fresh bread in Lyon\".",
    platformFixes: titleFixes,
  },
  "seo.title.too-short": {
    title: "Your page title is very short",
    what: "Your page title is too short to tell people what you offer.",
    why: "People choose which search result to click in a second. A one-word title like \"Home\" gives them no reason to pick you.",
    businessImpact: "You lose clicks to competitors with clearer titles.",
    fix: "Write a title of 30 to 60 characters that names your business, what you do, and where.",
    platformFixes: titleFixes,
  },
  "seo.title.too-long": {
    title: "Your page title gets cut off in Google",
    what: "Your page title is longer than Google shows, so the end is replaced by \"…\".",
    why: "The words that make people choose you may be hidden.",
    businessImpact: "People may not see what makes you the right choice, and click someone else.",
    fix: "Keep your title under 60 characters and put the most important words first.",
    platformFixes: titleFixes,
  },
  "seo.meta-description.missing": {
    title: "Your page has no summary for search results",
    what: "Your homepage doesn't provide the short text shown under your title in Google.",
    why: "Google then picks random text from your page, which may not sell your business.",
    businessImpact: "A weak summary means fewer people choose your site over others.",
    fix: "Write one or two sentences (about 120 to 160 characters) about what you offer and why people should choose you.",
    platformFixes: descriptionFixes,
  },
  "seo.meta-description.too-short": {
    title: "Your search result summary is very short",
    what: "The text shown under your title in Google is too short to be useful.",
    why: "A few words don't tell people what you offer or why you're different.",
    businessImpact: "People skip your result for one that explains more.",
    fix: "Expand it to one or two sentences (about 120 to 160 characters) that mention your main service and location.",
    platformFixes: descriptionFixes,
  },
  "seo.meta-description.too-long": {
    title: "Your search result summary gets cut off",
    what: "The text shown under your title in Google is longer than Google displays.",
    why: "The end is cut off, sometimes in the middle of your best point.",
    businessImpact: "Your message reaches people incomplete.",
    fix: "Keep it under about 160 characters and say the most important thing first.",
    platformFixes: descriptionFixes,
  },
  "seo.h1.missing": {
    title: "Your page has no main heading",
    what: "Your page has no headline marked as its main heading.",
    why: "Search engines and screen readers use the main heading to understand what the page is about.",
    businessImpact: "Google may rank you lower for the services you offer.",
    fix: "Add one clear headline near the top that says what you do, and set it as \"Heading 1\" in your editor.",
  },
  "seo.h1.multiple": {
    title: "Your page has more than one main heading",
    what: "Several headlines on your page are marked as the main heading.",
    why: "Search engines and screen readers can't tell which one is the real topic of the page.",
    businessImpact: "Your page's message is less clear to Google, which can cost you ranking.",
    fix: "Keep one \"Heading 1\" for your main message and change the others to \"Heading 2\".",
  },
  "seo.headings.skipped-level": {
    title: "Your headings skip a level",
    what: "Your headings jump levels, for example from a main heading straight to a third-level heading.",
    why: "Headings work like a table of contents. Gaps make the structure harder to follow.",
    businessImpact: "Visitors who use screen readers can get lost, and search engines understand your page less well.",
    fix: "Use heading levels in order: Heading 1, then Heading 2, then Heading 3. Choose the level by structure, not by text size.",
  },
  "seo.canonical.missing": {
    title: "Your page doesn't say which address is the main one",
    what: "Your page doesn't tell search engines which web address is its preferred one.",
    why: "The same page can often be reached by several addresses (with or without \"www\", or with tracking codes). Google may split your ranking between them.",
    businessImpact: "Your page may appear lower in Google than it should.",
    fix: "Most site builders set this automatically once your domain is connected. If yours doesn't, ask your developer to set the preferred address for your homepage.",
  },
  "seo.viewport.missing": {
    title: "Your page may not fit phone screens",
    what: "Your page doesn't tell phones to fit it to their screen.",
    why: "Phones then show a tiny desktop version that people have to pinch and zoom.",
    businessImpact: "Most visitors are on phones. Many will leave, and Google ranks pages that don't work on phones lower.",
    fix: "Use a mobile-friendly theme or template. A developer can add the one standard line shown in developer details.",
  },
  "seo.open-graph.incomplete": {
    title: "Your page looks plain when shared",
    what: "Your page is missing the title, description or image that apps use when someone shares your link.",
    why: "Without them, Facebook, WhatsApp and LinkedIn guess, and often show no image or the wrong text.",
    businessImpact: "Shared links get fewer clicks, so word of mouth brings you fewer visitors.",
    fix: "In your site's social sharing settings, add a share title, a short description and an image (1200 × 630 pixels works well).",
  },
  "seo.noindex": {
    title: "Your page is hidden from Google",
    what: "Your page tells search engines not to show it in results.",
    why: "This setting is often left on by accident after a site is built.",
    businessImpact: "People can't find you on Google at all.",
    fix: "Turn off the setting that hides your site from search engines. In WordPress, uncheck \"Discourage search engines\" in Settings › Reading. In other builders, look for \"hide from search engines\" or \"site visibility\".",
  },

  "technical.https.missing": {
    title: "Your site isn't secure (no padlock)",
    what: "Your site loads without the secure padlock (HTTPS) in the address bar.",
    why: "Browsers show a \"Not secure\" warning, and anything visitors type can be read by others on the same network.",
    businessImpact: "Visitors lose trust and leave, especially before filling in a form or paying. Google also ranks secure sites higher.",
    fix: "Turn on the free security certificate offered by your host or site builder, then make sure every visitor is sent to the secure address.",
    platformFixes: {
      wordpress:
        "In your hosting control panel, turn on the free certificate (often called SSL or Let's Encrypt). Then, in WordPress, go to Settings › General and change both addresses to start with https://. Ask your host to send all visitors to the https:// address.",
      wix: "Wix turns on HTTPS for you. If it's off, open your dashboard settings and search for \"SSL\" or \"HTTPS\" to switch it on. A newly connected domain can take up to 48 hours.",
      shopify:
        "Shopify includes free HTTPS. Go to Settings › Domains and check the certificate status. If it's pending, make sure your domain points to Shopify as shown on that page.",
      squarespace:
        "Squarespace includes free HTTPS. Open Settings and search for \"SSL\", then choose the secure option. A newly connected domain can take up to 72 hours.",
      webflow:
        "Open Site settings › Publishing, check that SSL is turned on under advanced publishing options, then publish your site again.",
    },
  },
  "technical.status.error": {
    title: "Your page returns an error",
    what: "When we visited, your server answered with an error instead of your page.",
    why: "Search engines may remove pages that keep returning errors.",
    businessImpact: "Visitors and Google may see an error message instead of your business.",
    fix: "Open your site in a private browser window to check that it loads. If it doesn't, contact your host or developer and give them the error code in developer details.",
  },
  "technical.redirects.too-many": {
    title: "Your address sends visitors through several detours",
    what: "Before your homepage appears, visitors are passed through several other addresses.",
    why: "Each detour adds waiting time, especially on phones.",
    businessImpact: "A slower start means more people give up before your page appears.",
    fix: "Make every version of your address go straight to the final one in a single step. Your host or developer can change these forwarding settings.",
  },
  "technical.mixed-content": {
    title: "Parts of your secure page load insecurely",
    what: "Your page is secure, but some images or files load from insecure addresses.",
    why: "Browsers may block those files or remove the padlock.",
    businessImpact: "Parts of your page may break or show security warnings, which hurts trust.",
    fix: "Change the listed files to addresses starting with https://, or upload them to your own site again. Developer details lists the files.",
  },
  "technical.headers.hsts.missing": {
    title: "Browsers aren't told to always use the secure version",
    what: "Your site doesn't tell browsers to always connect to it securely.",
    why: "Someone who types your address without \"https\" could briefly connect insecurely.",
    businessImpact: "A small security gap that careful customers and security scanners may notice.",
    fix: "Ask your host or developer to turn on the \"always use a secure connection\" setting. Developer details has the exact line.",
  },
  "technical.headers.csp.missing": {
    title: "Your site has no extra protection against harmful code",
    what: "Your site doesn't tell browsers which sources of code and content to trust.",
    why: "This protection limits the damage if someone manages to slip harmful code into your page.",
    businessImpact: "If your site is ever hacked, your visitors are more exposed.",
    fix: "Ask your developer to add a list of trusted sources for your site, and to test it first in a \"report only\" mode, because a wrong list can break parts of the page.",
  },
  "technical.headers.frame-options.missing": {
    title: "Other websites can show your page inside theirs",
    what: "Your site doesn't stop other websites from displaying your pages inside their own.",
    why: "Scammers can use this to trick visitors into clicking hidden buttons.",
    businessImpact: "Your brand could be used in a scam without your knowledge.",
    fix: "Ask your host or developer to block other websites from embedding yours. It's one line, shown in developer details.",
  },
  "technical.headers.content-type-options.missing": {
    title: "Browsers may guess what your files are",
    what: "Your site doesn't tell browsers to stop guessing what kind of file they are receiving.",
    why: "Guessing can let a disguised harmful file run.",
    businessImpact: "A small security gap that is quick to close.",
    fix: "Ask your host or developer to add the one-line setting shown in developer details.",
  },
  "technical.favicon.missing": {
    title: "We couldn't find your site icon",
    what: "Your page doesn't point to a site icon: the small image shown in browser tabs and bookmarks.",
    why: "Browsers sometimes find an icon in a standard place we don't check, so your site may already have one.",
    businessImpact: "Without an icon, your site looks less polished in tabs and on phone home screens.",
    fix: "Upload a square image (at least 512 × 512 pixels) in your site settings, usually called \"favicon\" or \"site icon\".",
  },
  "technical.robots-txt.missing": {
    title: "Your site has no instructions file for search engines",
    what: "We couldn't find a robots.txt file: the small file that tells search engines what they may visit.",
    why: "It isn't required, but it's the standard place to point search engines to the list of your pages.",
    businessImpact: "Search engines may take longer to discover all your pages.",
    fix: "Most site builders create one automatically. If yours doesn't, ask your developer to add the simple version shown in developer details.",
  },
  "technical.sitemap.missing": {
    title: "Search engines can't find a list of your pages",
    what: "We couldn't find a sitemap: the file that lists your pages for search engines.",
    why: "A sitemap helps Google find new and updated pages faster.",
    businessImpact: "New services or pages may take longer to show up in Google.",
    fix: "Turn on your site builder's sitemap, then add its address in Google Search Console (free).",
    platformFixes: {
      wordpress:
        "WordPress makes a sitemap automatically, and SEO plugins like Yoast SEO or Rank Math make a better one. Check that Settings › Reading › \"Discourage search engines\" is unchecked, then add your sitemap address in Google Search Console.",
      wix: "Wix creates your sitemap automatically once your site is published on a connected domain. Use the SEO setup checklist in your dashboard to connect Google Search Console.",
      shopify:
        "Shopify creates your sitemap automatically at /sitemap.xml. It only works when your store isn't password-protected (Online Store › Preferences). Add the address in Google Search Console.",
      squarespace:
        "Squarespace creates your sitemap automatically at /sitemap.xml. Make sure your site is public and not password-protected, then add the address in Google Search Console.",
      webflow:
        "Open Site settings › SEO, turn on \"Auto-generate sitemap\", and publish. Then add your sitemap address in Google Search Console.",
    },
  },

  "accessibility.img-alt.missing": {
    title: "Some images have no description",
    what: "Some images don't have a short text description (called alt text).",
    why: "Blind visitors using screen readers hear nothing for those images, and Google can't understand them.",
    businessImpact: "You shut out some customers and miss visitors from Google Images.",
    fix: "Add a short description to each meaningful image, like \"Chocolate birthday cake with candles\". Leave purely decorative images without one.",
    platformFixes: {
      wordpress:
        "Go to Media › Library, click an image, and fill in \"Alternative Text\". In the page editor, you can also select an image block and fill in \"Alternative text\" in the side panel.",
      wix: "In the editor, click the image, open its settings, and fill in the field that asks what's in the image. Publish your site.",
      shopify:
        "For product images, open the product, click the image, and choose \"Add alt text\". For images in your theme, open Online Store › Themes › Customize and look for the image's alt text field.",
      squarespace:
        "Edit the page, click the image block, and fill in the image's description or alt text field in the block settings. Save.",
      webflow:
        "Open the Assets panel, click the gear icon on an image, and fill in \"Alt text\". You can also select an image on the page and set it in the Settings panel. Then publish.",
    },
  },
  "accessibility.form-label.missing": {
    title: "Some form fields have no label",
    what: "Some fields in your forms have no name that screen readers can announce.",
    why: "Grey hint text inside a field disappears as people type and isn't a reliable label.",
    businessImpact: "Some visitors can't fill in your contact or order form, so you lose enquiries.",
    fix: "Give every field a visible label, like \"Email address\", in your form editor.",
  },
  "accessibility.link-name.missing": {
    title: "Some links have no text",
    what: "Some links, often icons or images, have no text that says where they go.",
    why: "Screen readers just say \"link\", so visitors don't know what it does.",
    businessImpact: "Visitors who use screen readers may miss key pages like your shop or contact page.",
    fix: "Add text to each link, or give icon links a label such as \"Instagram\" or \"Shopping cart\".",
  },
  "accessibility.button-name.missing": {
    title: "Some buttons have no text",
    what: "Some buttons, often icons, have no text that says what they do.",
    why: "Screen readers just say \"button\", so visitors can't tell what will happen.",
    businessImpact: "Some visitors can't open your menu, close a pop-up or send a form.",
    fix: "Add text to each button, or give icon buttons a label such as \"Open menu\" or \"Close\".",
  },
  "accessibility.lang.missing": {
    title: "Your page doesn't say what language it's in",
    what: "Your page doesn't declare its language.",
    why: "Screen readers may read it with the wrong pronunciation, and search engines may show it to the wrong audience.",
    businessImpact: "Some visitors can't understand your page, and you may reach fewer people who speak your language.",
    fix: "Set your site language in your site builder's settings. A developer can add it in one line (see developer details).",
  },

  "performance.lcp.slow": {
    title: "Your main content appears slowly on phones",
    what: "On a typical phone, the biggest part of your page (usually the main image or headline) takes too long to appear.",
    why: "People judge a site within seconds. A blank or half-loaded page looks broken.",
    businessImpact: "Visitors leave before your page loads, and Google ranks slow pages lower.",
    fix: "Start with the main image at the top: make it smaller and compressed, and avoid large sliders or videos at the top of the page.",
  },
  "performance.cls.high": {
    title: "Your page jumps around while loading",
    what: "Text and buttons move around as images, banners or fonts load.",
    why: "People tap the wrong thing or lose their place while reading.",
    businessImpact: "Frustrated visitors leave, and accidental taps can cost you sales.",
    fix: "Ask your developer to reserve space for images and banners so nothing moves. Avoid pop-ups and bars that push content down.",
  },
  "performance.interactivity.slow": {
    title: "Your page is slow to respond to taps",
    what: "After your page appears, it takes a while to react when visitors tap or type.",
    why: "Heavy add-ons keep the phone busy, so it can't respond.",
    businessImpact: "Your site feels sluggish and visitors give up.",
    fix: "Remove plugins, apps, chat bubbles and trackers you don't use. Each one adds work for the phone.",
  },
  "performance.first-paint.slow": {
    title: "Your page stays blank for too long",
    what: "On a typical phone, it takes a while before anything appears on the screen.",
    why: "A blank screen makes people think the site is broken.",
    businessImpact: "Visitors press the back button before they see your business.",
    fix: "Reduce what has to load first: fewer plugins, fonts and add-ons. A faster hosting plan can also help.",
  },
  "performance.server.slow": {
    title: "Your server is slow to answer",
    what: "Your hosting takes a long time to send the first part of your page.",
    why: "Everything else on the page waits for this first answer.",
    businessImpact: "Every visitor waits longer, on every page.",
    fix: "Turn on your host's speed or caching option, or move to faster hosting. You can also ask your host why it is slow.",
  },
  "performance.images.unoptimized": {
    title: "Your images are larger than they need to be",
    what: "Some images are bigger, in file size or dimensions, than your page needs.",
    why: "Oversized images are the most common reason sites are slow, especially on mobile data.",
    businessImpact: "Visitors wait longer and use more of their data, and many leave.",
    fix: "Resize images to the size they're shown at (rarely wider than 2000 pixels), compress them, and use a modern format like WebP when your builder allows it.",
    platformFixes: {
      wordpress:
        "Compress images before uploading (free tools like Squoosh work well), or install an image optimization plugin that compresses and converts them to WebP automatically.",
      wix: "Wix compresses images for you, so the main fix is upload size: avoid huge photos and large GIFs, and limit how many images appear at the top of the page.",
      shopify:
        "Shopify resizes images for you, but large originals still slow pages down. Compress big photos before uploading, and remove sliders with many large images from your homepage.",
      squarespace:
        "Resize images to between 1500 and 2500 pixels wide and compress them before uploading. Keep each file under about 500 KB.",
      webflow:
        "Open the Assets panel and use the option to compress images or convert them to WebP. Make sure large images below the top of the page are set to load lazily, then publish.",
    },
  },
  "performance.render-blocking": {
    title: "Some files delay your page from appearing",
    what: "Some files must finish loading before your page can appear.",
    why: "The screen stays blank while the phone waits for them.",
    businessImpact: "Visitors see your page later, and some leave.",
    fix: "Remove plugins and apps you don't use. Your developer can load the remaining files in a way that doesn't hold up the page.",
  },
  "performance.unused-code": {
    title: "Your page loads code it doesn't use",
    what: "Your page downloads code that isn't needed on this page.",
    why: "Extra code takes time to download and process, especially on phones.",
    businessImpact: "A slower, heavier page for every visitor.",
    fix: "Uninstall plugins, apps and widgets you no longer use. Your developer can remove leftover code.",
  },
  "performance.text-compression": {
    title: "Your files aren't compressed",
    what: "Your server sends text files without shrinking them first.",
    why: "Compression can make these files several times smaller, at no cost.",
    businessImpact: "Pages load slower than they need to, especially on mobile data.",
    fix: "Turn on compression in your hosting control panel, or ask your host to enable it. It's usually a single switch.",
  },
  "performance.caching": {
    title: "Returning visitors download everything again",
    what: "Your site doesn't tell browsers to keep files they've already downloaded.",
    why: "Returning visitors download the same images and files every time.",
    businessImpact: "Your regular customers get a slower site on every visit.",
    fix: "Turn on the browser caching option of your host or of a caching plugin, or ask your host to set it up.",
  },
  "performance.other": {
    title: "Another way to make your page faster",
    what: "Google's speed test found something else that slows your page down.",
    why: "Small delays add up, especially on phones.",
    businessImpact: "A slower site means more visitors leave before they see what you offer.",
    fix: "Send the developer details to your developer. They show exactly what Google's test found.",
  },

  "local.schema.missing": {
    title: "Google can't read your business details",
    what: "Your page doesn't include your business details (name, address, phone, hours) in a form Google reads automatically.",
    why: "Google uses these details to show your business in local results and on maps.",
    businessImpact: "You may appear less often when people search for businesses like yours nearby.",
    fix: "Add your business details in your site builder's local business or SEO settings, or ask your developer to add the block in developer details. Also complete your free Google Business Profile.",
  },
  "local.phone.missing": {
    title: "Your phone number isn't tappable",
    what: "There is no tap-to-call link on your page.",
    why: "On phones, people expect to tap a number to call it. Typing it in is a hassle.",
    businessImpact: "You lose calls from people who are ready to book or buy.",
    fix: "Turn your phone number into a link so phones offer to call it. Most editors let you link text to a phone number.",
  },
  "local.address.missing": {
    title: "Your address isn't on your homepage",
    what: "We couldn't find your address on the page.",
    why: "Local customers and Google both look for it to confirm where you are.",
    businessImpact: "People may not visit, and Google may be less confident showing you in local searches.",
    fix: "Show your full address, for example in the footer, written exactly as on your Google Business Profile.",
  },
  "local.hours.missing": {
    title: "Google can't read your opening hours",
    what: "Your opening hours aren't included in the business details Google reads.",
    why: "Google can show your hours directly in search results and maps.",
    businessImpact: "Customers may think you're closed, or call to ask instead of coming in.",
    fix: "Add your opening hours to your business details (see developer details), and keep them up to date on your Google Business Profile.",
  },
  "local.map.missing": {
    title: "There's no map to help people find you",
    what: "Your page doesn't link to or show a map of your location.",
    why: "A map makes getting directions a single tap.",
    businessImpact: "Customers who can't find you easily may go somewhere else.",
    fix: "Add a Google Maps map or a \"Get directions\" link to your contact section.",
  },
} satisfies KbLocale;
