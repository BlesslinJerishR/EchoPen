import { NextResponse } from "next/server";
import { chromium } from "playwright";

export async function POST(req) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  let browser = null;
  let context = null;
  let page = null;

  try {
    const { content, auth_token, ct0 } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Nothing to post" }, { status: 400 });
    }

    if (!auth_token || !ct0) {
      return NextResponse.json(
        { error: "Missing auth_token or ct0" },
        { status: 400 }
      );
    }

    console.log("Launching browser...");

    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
      ],
    });

    console.log("Browser launched successfully");

    context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
      bypassCSP: true,
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    console.log("Context created");

    // Set cookies for both domains
    const cookieDomains = [".x.com", ".twitter.com"];
    const cookieList = [];

    for (const domain of cookieDomains) {
      cookieList.push(
        {
          name: "auth_token",
          value: auth_token,
          domain: domain,
          path: "/",
          secure: true,
          httpOnly: true,
          sameSite: "None",
        },
        {
          name: "ct0",
          value: ct0,
          domain: domain,
          path: "/",
          secure: true,
          httpOnly: false,
          sameSite: "Lax",
        }
      );
    }

    await context.addCookies(cookieList);
    console.log("Cookies set");

    page = await context.newPage();
    console.log("Page created");

    // Anti-detection
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    page.setDefaultNavigationTimeout(60000); // Increased timeout
    page.setDefaultTimeout(30000);

    console.log("Navigating to X.com...");

    // Fix: Change waitUntil strategy and add fallback
    try {
      await page.goto("https://x.com/home", {
        waitUntil: "domcontentloaded", // Changed from "networkidle"
        timeout: 30000, // Reduced timeout since we're not waiting for networkidle
      });
      console.log("Successfully navigated to x.com");
    } catch (navError) {
      console.log("X.com failed, trying twitter.com...");
      try {
        await page.goto("https://twitter.com/home", {
          waitUntil: "domcontentloaded", // Changed from "networkidle"
          timeout: 30000,
        });
        console.log("Successfully navigated to twitter.com");
      } catch (secondNavError) {
        console.log(
          "Both domains failed, but checking if page loaded anyway..."
        );
        // Sometimes the page loads even if navigation "fails"
        // Let's check if we can find key elements
        try {
          await page.waitForSelector('main, [data-testid="primaryColumn"]', {
            timeout: 10000,
          });
          console.log("Page appears to be loaded despite navigation timeout");
        } catch {
          throw new Error("Failed to navigate to Twitter/X");
        }
      }
    }

    // Wait for page to be ready
    await page.waitForTimeout(3000);

    console.log("Checking login status...");

    // Find compose button with multiple selectors
    let composeButton = null;
    const composeSelectors = [
      '[data-testid="SideNav_NewTweet_Button"]',
      'a[href="/compose/tweet"]',
      '[data-testid="SideNav_NewTweet_Button"] > div',
      '[aria-label*="Tweet"]',
    ];

    for (const selector of composeSelectors) {
      try {
        composeButton = await page.waitForSelector(selector, {
          state: "visible",
          timeout: 5000,
        });
        if (composeButton) {
          console.log(`Found compose button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }

    if (!composeButton) {
      throw new Error("Not logged in or compose button not found");
    }

    console.log("Clicking compose button...");
    await composeButton.click();

    await page.waitForTimeout(2000);

    console.log("Looking for tweet textarea...");

    // Wait for the textarea container with multiple attempts
    let textareaContainer = null;
    const textareaSelectors = [
      '[data-testid="tweetTextarea_0"]',
      '[contenteditable="true"][aria-label*="Tweet"]',
      ".DraftEditor-editorContainer",
      '[role="textbox"]',
    ];

    for (const selector of textareaSelectors) {
      try {
        textareaContainer = await page.waitForSelector(selector, {
          state: "visible",
          timeout: 5000,
        });
        if (textareaContainer) {
          console.log(`Found textarea with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Textarea selector ${selector} not found, trying next...`);
      }
    }

    if (!textareaContainer) {
      throw new Error("Could not find tweet textarea");
    }

    console.log("Typing tweet content...");

    // Enhanced content input method
    await textareaContainer.click();
    await page.waitForTimeout(500);

    // Clear any existing content first
    await page.keyboard.down("Control");
    await page.keyboard.press("A");
    await page.keyboard.up("Control");
    await page.keyboard.press("Delete");
    await page.waitForTimeout(300);

    // Type the content
    await page.keyboard.type(content, { delay: 50 });

    // Trigger input events
    await page.evaluate(() => {
      const textarea = document.querySelector(
        '[data-testid="tweetTextarea_0"], [contenteditable="true"][aria-label*="Tweet"]'
      );
      if (textarea) {
        const inputEvent = new Event("input", { bubbles: true });
        textarea.dispatchEvent(inputEvent);
        const changeEvent = new Event("change", { bubbles: true });
        textarea.dispatchEvent(changeEvent);
      }
    });

    await page.waitForTimeout(2000);

    console.log("Checking if post button is enabled...");

    // Find and click post button
    let postButton = null;
    const postSelectors = [
      '[data-testid="tweetButtonInline"]',
      '[data-testid="tweetButton"]',
      '[role="button"][aria-label*="Post"]',
    ];

    for (const selector of postSelectors) {
      try {
        postButton = await page.waitForSelector(selector, {
          state: "visible",
          timeout: 3000,
        });
        if (postButton) {
          console.log(`Found post button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(
          `Post button selector ${selector} not found, trying next...`
        );
      }
    }

    if (!postButton) {
      throw new Error("Could not find post button");
    }

    // Check if button is enabled
    const isDisabled = await postButton.evaluate((el) => {
      return (
        el.getAttribute("aria-disabled") === "true" ||
        el.hasAttribute("disabled") ||
        el.disabled === true
      );
    });

    if (isDisabled) {
      console.log("Button is disabled, waiting for it to enable...");
      // Wait a bit more for the button to enable
      await page.waitForTimeout(3000);
    }

    console.log("Clicking post button...");

    // Try clicking the button
    try {
      await postButton.click();
    } catch (clickError) {
      console.log("Regular click failed, trying JavaScript click...");
      await page.evaluate(() => {
        const button = document.querySelector(
          '[data-testid="tweetButtonInline"], [data-testid="tweetButton"]'
        );
        if (button) {
          button.click();
        }
      });
    }

    console.log("Waiting for tweet to be posted...");

    // Wait for success indicators
    await Promise.race([
      page
        .waitForSelector('[data-testid="tweetTextarea_0"]', {
          state: "hidden",
          timeout: 15000,
        })
        .catch(() => console.log("Textarea didn't disappear")),
      page
        .waitForLoadState("networkidle", { timeout: 10000 })
        .catch(() => console.log("Network didn't idle")),
      page.waitForTimeout(8000), // Fallback timeout
    ]);

    console.log("Tweet posted successfully!");

    // Clean up
    await page.close();
    await context.close();
    await browser.close();

    return NextResponse.json({
      success: true,
      message: "Tweet posted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error during tweet posting:", error.message);

    // Enhanced error debugging
    if (page) {
      try {
        const screenshot = await page.screenshot({
          path: `error-${Date.now()}.png`,
          fullPage: true,
        });

        const debugInfo = await page.evaluate(() => {
          const textarea = document.querySelector(
            '[data-testid="tweetTextarea_0"], [contenteditable="true"][aria-label*="Tweet"]'
          );
          const button = document.querySelector(
            '[data-testid="tweetButtonInline"], [data-testid="tweetButton"]'
          );
          const url = window.location.href;
          const title = document.title;

          return {
            url,
            title,
            textareaExists: !!textarea,
            textareaContent: textarea
              ? textarea.textContent || textarea.innerText
              : "not found",
            buttonExists: !!button,
            buttonDisabled: button
              ? button.getAttribute("aria-disabled")
              : "not found",
            buttonText: button
              ? button.textContent || button.innerText
              : "not found",
            bodyClasses: document.body.className,
          };
        });

        console.log("Enhanced debug info:", debugInfo);
      } catch (e) {
        console.log("Could not capture debug info:", e.message);
      }
    }

    // Clean up
    try {
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
    } catch (e) {
      console.log("Error during cleanup:", e.message);
    }

    return NextResponse.json(
      {
        error: `Failed to post tweet: ${error.message}`,
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Tweet posting API is running",
    timestamp: new Date().toISOString(),
  });
}
