from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Navigate to login to set localStorage
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.evaluate('''() => {
            localStorage.setItem('token', 'fake-token-123');
            localStorage.setItem('user', JSON.stringify({id: '1', name: 'Test Admin', role: 'admin'}));
        }''')

        # Navigate to dashboard
        page.goto("http://localhost:3000/", wait_until="networkidle")
        page.wait_for_timeout(2000)

        # Open notification dropdown (assuming the bell icon has a specific class or we can find it)
        try:
            # Look for the button containing the bell icon. Usually it's in the Sidebar or Header.
            # In our sidebar component, we have the NotificationCenter.
            # We can find the button with class contains 'text-slate-400' and 'relative' which holds the Bell.
            page.locator('button:has(svg.lucide-bell)').click()
            page.wait_for_timeout(1000)
        except Exception as e:
            print("Could not click notification bell:", e)

        page.screenshot(path="sidebar_notification.png")
        print("Screenshot saved to sidebar_notification.png")

        browser.close()

if __name__ == "__main__":
    run()
