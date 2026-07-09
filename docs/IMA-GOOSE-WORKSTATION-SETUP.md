# IMA Goose Workstation Setup Guide

First-run and support guide for the IMA Goose Workstation VirtualBox appliance.
Use this to get from a workstation package to a working Goose Desktop session
with `/preflight` completed.

## Who This Is For

Use this guide if you received an IMA Goose Workstation VM/OVA package or you
support someone using that package. If you are building the tooling from source,
use [`IMA-GOOSE-FULL-SETUP.md`](IMA-GOOSE-FULL-SETUP.md) instead.

## What This Workstation Provides

IMA Goose Workstation is a preconfigured VirtualBox computer for Goose Desktop
and IMA Goose tools. It runs on a normal host computer but has its own desktop,
tools, credentials, memory, local helper commands, and work folder.

The practical goal is to:

1. install VirtualBox;
2. import the workstation OVA;
3. log in;
4. connect a `GooseWork` shared folder;
5. open Goose Desktop;
6. check credentials and workstation status;
7. run `/preflight` inside Goose.

## Install VirtualBox

Install VirtualBox on the normal host computer from the official site:

```text
https://www.virtualbox.org
```

Use that exact address or IMA-provided instructions. If VirtualBox itself will
not install or open, contact IMA support rather than searching for unofficial
installers.

## Import the OVA

1. Open VirtualBox on the normal host computer.
2. Choose the option to import an appliance.
3. Select the provided `.ova` file.
4. Accept the default or IMA-provided settings unless support says otherwise.
5. Start the imported **IMA Goose Workstation**.

The final OVA and checksum filenames may vary. Use the files provided in your
workstation package.

## Start and Log In

For the pilot workstation baseline:

```text
Username: chef
Password: honk
```

These login details are only for entering the workstation desktop. They are not
AI provider credentials and must not be reused as API keys or passwords
elsewhere.

## Set Up the GooseWork Shared Folder

`GooseWork` is the shared folder used to move files between the normal computer
and IMA Goose Workstation.

| Location | Typical path |
|---|---|
| Windows host | `C:\Users\<your-name>\GooseWork` |
| Mac host | `/Users/<your-name>/GooseWork` |
| Linux host | `/home/<your-name>/GooseWork` |
| IMA Goose Workstation | `~/GooseWork` |

To configure it:

1. Shut down IMA Goose Workstation if it is running.
2. Open VirtualBox Manager on the host computer.
3. Select **IMA Goose Workstation**.
4. Open **Settings → Shared Folders**.
5. Add the host `GooseWork` folder.
6. Set **Folder Name** to `GooseWork`.
7. Enable **Auto-mount** and **Make Permanent**.
8. Start IMA Goose Workstation and log in.

VirtualBox commonly mounts the folder at `/media/sf_GooseWork`. The expected
friendly path inside the workstation is `~/GooseWork`. If `/media/sf_GooseWork`
exists but `~/GooseWork` does not, support staff can create the symlink:

```bash
ln -s /media/sf_GooseWork ~/GooseWork
```

Only run that command if `~/GooseWork` does not already exist.

## Two-Way File Test

1. On the normal computer, create `hello-from-normal-computer.txt` in
   `GooseWork`.
2. Inside IMA Goose Workstation, confirm it appears in `~/GooseWork`.
3. Inside IMA Goose Workstation, create
   `hello-from-ima-goose-workstation.txt` in `~/GooseWork`.
4. On the normal computer, confirm the file appears in the host `GooseWork`
   folder.

The success signal is simple: files created on either side appear on the other
side.

## Open Goose Desktop

Use the **Open Goose Desktop** shortcut when it is available. If the shortcut is
not present in a pilot image, follow IMA support guidance for that image.

## Set or Check Credentials

Some workflows need local credentials for provider access, Tavily research,
Atlassian, Jira, Confluence, or other integrations. Use **Set Goose Credentials**
when the shortcut is available.

Support may also ask you to run:

```bash
goose-workstation credentials
```

That command checks whether expected local credentials are present. It does not
validate them with providers and never prints secret values.

Never paste API keys, passwords, SSH keys, provider tokens, or Atlassian tokens
into Goose chats, support tickets, or messages.

## Check Workstation Status

Use **Check Goose Status** when the shortcut is available, or run:

```bash
goose-workstation status
```

This is the outside-Goose workstation health check. It checks installed
prerequisites such as helper version, Goose availability, IMA Goose checkout,
recipes and skills, `ima-mcp`, Serena, Vestige, Qdrant, `ima-rag`, credential
presence, `~/GooseWork`, and update status.

## Run /preflight Inside Goose

`goose-workstation status` and `/preflight` are related but not the same check.

| Check | Where it runs | What it tells you |
|---|---|---|
| `goose-workstation status` | Outside Goose Desktop | Workstation health and installed prerequisites. |
| `/preflight` | Inside a Goose session | Recipe and MCP behavior from Goose itself. |

To run `/preflight`:

1. Open Goose Desktop.
2. Start a Goose session.
3. Type `/preflight`.
4. Follow support guidance for any reported problems.

## Update IMA Goose Workstation

Use **Update Goose Workstation** when the shortcut is available, or run:

```bash
goose-workstation update
```

This updates IMA Goose tooling. It is not a full operating-system upgrade. It
records logs so support can understand what happened. If an update fails, do not
repeatedly rerun it; contact support and include the saved log or a support
bundle.

## Collect a Support Bundle

Use **Collect Support Bundle** when the shortcut is available, or run:

```bash
goose-workstation support-bundle
```

The support bundle writes a plain-text diagnostic file to the Desktop when
possible, otherwise to the home folder. It does not upload automatically; the
user chooses whether to send it to IMA support.

Support bundles may contain sensitive local support or configuration data and
should be handled as support artifacts. They intentionally exclude credential
values, browser sessions, shell history, GooseWork document contents, private
memory databases, arbitrary user files, and recursive home-directory archives.

## Safety, Privacy, and Redistribution

- Do not redistribute or re-export a VM after personal use.
- A personalized VM may contain credentials, local memory, logs, browser
  sessions, or private work.
- Goose may send content to configured AI providers. Follow IMA AI and data
  policies.
- Do not enter patient data or restricted/confidential data unless explicitly
  approved by IMA policy.
- Run `sudo` commands only when they come from official IMA support or official
  IMA instructions.
- Do not paste API keys, tokens, passwords, or SSH keys into Goose, support
  tickets, or chat.

## Troubleshooting

### GooseWork Is Missing or Not Sharing

Confirm the VirtualBox shared folder is named `GooseWork`, auto-mounted, and
permanent. Check whether `/media/sf_GooseWork` exists inside the workstation. If
shared-folder permissions are the issue, support may ask you to run:

```bash
sudo usermod -aG vboxsf chef
```

Restart or log out and back in before testing again.

### Goose Desktop Does Not Open

Run or ask support to check:

```bash
goose-workstation status
```

Send the relevant status output or support bundle to IMA support. Do not paste
secrets.

### Credentials Are Missing

Use **Set Goose Credentials** or run:

```bash
goose-workstation credentials
```

Contact support if you are unsure which credentials your workflow needs.

### Status Reports WARN or FAIL

Read the next steps in the status output. If needed, collect a support bundle and
send it to IMA support as a support artifact.

### Window Resize, Mouse, Shared Folders, or VirtualBox Behavior Is Odd

Refresh VirtualBox Guest Additions for the host computer's VirtualBox version.
These symptoms often come from Guest Additions mismatch or shared-folder
permissions.

### Reinstall or Update Guest Additions

1. Start IMA Goose Workstation and log in.
2. In the VirtualBox window menu, choose **Devices → Insert Guest Additions CD
   image**.
3. Inside Linux Mint, open the mounted Guest Additions disc if it does not open
   automatically.
4. Run the Guest Additions installer from the disc.
5. Enter the workstation password if Linux Mint asks.
6. Wait for the installer to finish.
7. Restart IMA Goose Workstation.

After restart, verify that the desktop opens normally, the window resizes, mouse
integration feels natural, and shared folders can be configured.

## Success Signal

You can start IMA Goose Workstation, log in, see your `GooseWork` files, open
Goose Desktop, run `goose-workstation status`, and run `/preflight`. If that
works, the workstation is ready for pilot use.
