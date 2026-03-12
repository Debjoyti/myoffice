# Fix Git Push Permission (403 denied)

**Problem:** Git is using `dlouha_LinkedIn` credentials, but push access to `Debjoyti/myoffice` is denied.

## Option 1: Add Collaborator (fastest if you have access)

1. Go to https://github.com/Debjoyti/myoffice/settings/access
2. Click **Add people**
3. Add `dlouha_LinkedIn` (or your GitHub username) as a collaborator
4. Accept the invite on the added account
5. Run: `git push`

---

## Option 2: Use Debjoyti credentials

### Step 1: Clear stored GitHub credentials

Run in Terminal:

```bash
printf "protocol=https\nhost=github.com\n" | git credential reject
printf "protocol=ssh\nhost=github.com\n" | git credential reject
```

### Step 2: Create a Personal Access Token (for Debjoyti)

1. Log into GitHub as **Debjoyti**
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. Generate new token, enable `repo` scope
4. Copy the token

### Step 3: Push (you'll be prompted)

```bash
cd /Users/dlouha/Documents/myoffice
git push
```

- **Username:** Debjoyti  
- **Password:** paste your Personal Access Token (not your GitHub password)

---

## Option 3: Switch to SSH with Debjoyti's key

If you have an SSH key added to the Debjoyti GitHub account:

```bash
git remote set-url origin git@github.com:Debjoyti/myoffice.git
git push
```

If it still uses dlouha_LinkedIn's key, add Debjoyti's key to `~/.ssh/config` for github.com.
