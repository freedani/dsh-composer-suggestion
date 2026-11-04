# dsh-composer-suggestion

Composer suggestions for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

After a turn ends, one suggested next message appears as ghost text inside the
input box; press **Tab** to accept it as an editable draft. A second, independent
switch adds prediction while you type.

This is a personal fork of
[Stijnus/dsh-composer-predictions](https://github.com/Stijnus/dsh-composer-predictions).
See [Differences from upstream](#differences-from-upstream).

## What it does

| Trigger | When it asks | Default |
|---|---|---|
| **Next-message suggestion** | a turn settles and the composer is empty (600 ms later) | **on** |
| **Mid-draft prediction** | you pause typing, caret at the end of the draft (500 ms later) | off |

- The suggestion renders inside the composer; the native placeholder is hidden
  while ghost text shows, so the two never paint over each other.
- **Tab** accepts it into the draft, **Alt+↑ / Alt+↓** cycle candidates, **Esc**
  dismisses the current one.
- Accepting only fills an editable draft — nothing is ever sent for you.
- Nothing is requested while the page is hidden, during IME composition, or for a
  mid-draft prediction whose draft is shorter than three characters.

## Settings

`Settings → Composer suggestion` has its own page with the two switches above.
They are stored per browser, so two clients can disagree.

Both were a single master switch upstream. They are separate here because they
cost very different amounts and suit different moments: one bounded call per turn
versus one call per typing pause.

## Configuration

Entry `composer-suggestion` in the bundle's `cordis.patch.yml`:

| Key | Default | Meaning |
|---|---|---|
| `sharePromptCache` | `true` | Reuse the main request's exact prefix (tools + full history) so the provider's prompt cache serves it. `false` sends a small self-contained prompt instead. |
| `maxOutputTokens` | `220` | Output cap for one suggestion call. |
| `timeoutMs` | `20000` | Per-call timeout. |
| `maxSuggestions` | `3` | Candidates to ask for (cycled with Alt+↑/↓). |
| `maxMessages` | `10` | Only read when `sharePromptCache` is off: messages kept from the tail. |
| `maxChars` | `8000` | Only when off: character budget of the tail. |
| `maxToolNotes` | `6` | Only when off: recent tool calls quoted in the prompt. |
| `provider` / `model` | inherited | A fixed route. Both or neither. |
| `reasoningEffort` | inherited | Only meaningful when `sharePromptCache` is off. |

The default route is the session's own provider and model. With
`sharePromptCache: true` the request inherits the main request's controls
verbatim, including the reasoning effort — changing them changes the request
shape and turns the shared prefix into a cache miss.

## Cost

The next-message trigger is at most one bounded call per completed turn. The
mid-draft trigger fires after *every* typing pause and therefore costs noticeably
more, which is why it ships off.

With `sharePromptCache` the bulk of the input is served from the provider's prefix
cache; only the assistant reply and the instruction turn are new tokens. Without
it, every input token is a cache miss.

## Install

```
plugin_manager(action="install_bundle", target="/absolute/path/to/dsh-composer-suggestion")
```

Then reload the client page once so the browser half is picked up.

## Differences from upstream

- **Own package id** (`dsh-composer-suggestion`) and its own bundle row, so it can
  be installed next to the upstream package instead of replacing it.
- **One switch per trigger** instead of one master switch, on a Settings page of
  its own.
- **`sharePromptCache`**: the Host sends the exact prefix the agent loop used, so
  the provider can serve it from cache, and falls back to a self-contained prompt
  if that request fails.
- **Identity invariants are tested**: `test/client-registration.test.js` fails if
  the id inside the client bundle ever drifts from `package.json`'s name. A
  mismatch makes the module loader re-execute the batch and abort web boot.

## Development

```
node --test     # runs the tests in test/
```

`client.js` and `index.js` are the sources; there is no build step.
Release and distribution steps live in [RELEASING.md](RELEASING.md).

## License

MIT. Based on
[dsh-composer-predictions](https://github.com/Stijnus/dsh-composer-predictions)
by Stijnus; the upstream copyright notice is preserved in [LICENSE](LICENSE).
