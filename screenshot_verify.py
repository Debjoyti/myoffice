import sys
import time
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 800})

        page.goto("http://localhost:3000/login")
        page.evaluate('''() => {
            localStorage.setItem('token', 'fake-token-123');
            localStorage.setItem('user', JSON.stringify({id: '1', name: 'Test Admin', role: 'admin'}));
        }''')

        page.goto("http://localhost:3000/careers")
        page.wait_for_timeout(3000)

        page.screenshot(path="careers_job_board.png")

        page.goto("http://localhost:3000/attendance")
        page.wait_for_timeout(2000)
        page.screenshot(path="attendance_overtime.png")

        page.goto("http://localhost:3000/employees")
        page.wait_for_timeout(2000)

        # Click add employee button
        try:
            page.get_by_role("button", name="Add Employee").click()
            page.wait_for_timeout(1000)
            page.screenshot(path="employees_parking.png")
        except:
            print("Could not find Add Employee button")

        browser.close()

if __name__ == "__main__":
    verify()
