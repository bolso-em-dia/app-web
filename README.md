# app-web

## Layout Refactor Plan

### Objective

Replace the current `side list + always-visible form` pattern with a clearer
management layout:

1. toolbar at the top
2. primary list in the main page body
3. create and edit in a drawer
4. destructive actions isolated from the main list flow

### Why

The current pattern mixes exploration, inspection, and editing in the same
surface. That makes the UI crowded and generic, especially on pages that are
supposed to feel like a finance tool instead of a basic admin scaffold.

The new pattern should:

- keep the list as the primary surface
- use page width more effectively
- isolate editing work in a focused panel
- scale better as filters, details, and actions grow

### Scope

Pages using the current pattern:

- `family`
- `categories`
- `accounts`
- `envelopes`
- `fixed-expenses`
- `transactions`

### Target Pattern

#### Main page

- page title and actions in the shell header
- optional toolbar for filters and secondary actions
- list or table as the dominant page body

#### Editing

- create and edit open a right-side drawer
- drawer contains the feature form
- drawer may include contextual destructive actions when relevant

#### Destructive actions

- archive and delete actions live in a secondary section inside the drawer or a
  dedicated confirmation flow

### Implementation Order

1. create minimal shared drawer infrastructure
2. migrate `categories` as the pilot page
3. validate tests and checks
4. migrate the other management pages
5. migrate `transactions` last because it is the most complex screen
