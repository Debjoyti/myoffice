from playwright.sync_api import sync_playwright
import time
import requests

def run():
    # Let's just bypass the login form by injecting the token into localStorage
    # We can get a fresh token via python requests first
    resp = requests.post("http://127.0.0.1:8000/api/auth/login", json={"email":"admin@prsk.ai","password":"password123","name":""})
    data = resp.json()
    token = data["access_token"]
    user = data["user"]
    import json
    user_json = json.dumps(user)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # We have to navigate to the domain first to set localStorage
        page.goto("http://localhost:3000/login", wait_until="networkidle")

        # Inject token
        page.evaluate(f"localStorage.setItem('token', '{token}');")
        page.evaluate(f"localStorage.setItem('user', '{user_json}');")

        # Now navigate to dashboard, it should bypass login
        print("Navigating to dashboard...")
        page.goto("http://localhost:3000/", wait_until="networkidle")
        page.wait_for_timeout(2000)
        print("URL after dashboard navigation:", page.url)

        print("Navigating to Business Orders...")
        page.goto("http://localhost:3000/business-orders", wait_until="networkidle")
        page.wait_for_timeout(3000)

        print("URL after business-orders navigation:", page.url)
        page.screenshot(path="business_orders.png", full_page=True)
        print("Done.")

        browser.close()

if __name__ == "__main__":
    run()
