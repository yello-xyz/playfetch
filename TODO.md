## PlayFetch TODO

### Functional
- Code blocks used in chains should probably be separate entities like prompts with their own versioning. Should be relatively straightforward but quite a lot of work.
- Log and expose provider duration (time spent waiting for LLM) separately from total duration even though the overhead we are adding should be negligible in practice.
- Generalise deployment so it includes both endpoints and source control as separate options.
- Add option to expose endpoint logs to project owners only (or add a dedicated team role for it).
- Warn when response is getting close in length to the maximum number of tokens.

### Scalability
- With very long prompts and/or responses, we are starting to hit the limits of what is practical to store directly in (and load from) the datastore. This could be optimised by storing longer text content as files in storage instead, keeping a reference in the datastore, and loading the full content lazily on demand.
- At some point we probably want to add a Memcache layer or similar rather than accessing the datastore directly.
- We should add paging for prompts within a project, versions within a prompt, responses within a version, etc. rather than limit it to 100 (which has worked well so far except for endpoint logs where we added paging).

### User experience
- Make column order fixed so editing tables becomes more predictable (these evolved from a more basic mapping of variables to lists of values where order didn't matter).
- Reload prompt editor somehow on adding test data columns so auto-complete for these variables does not require manual reload.
- Add some basic filters in the endpoints view e.g. environment.
- Add typing indicator while waiting for auto-generated responses.
- Add small logo to comments synced from Linear.

### Technical
- Avoid processing tasks in Linear webhook for versions that are marked for deletion but still pending actual cleanup.
- Metadata should probably not be wrapped in environment for GitHub/Linear provider entities.
- Navigating back triggers an undefined id error resulting in a blank page if a push happened on the backend after loading the current page.
- Expose Google models as part of the generic LLM provider framework (with an API key) rather than treating them separately (through cloud infra).
- Retry adding support for functions with Gemini Pro as it didn't seem to work initially.
- Rely on response metadata for more accurate token count where available.

### New Features
- Add templates for common use cases and shareable prompt links. 
- Explore integrating OpenAI Assistants API.
- Auto-generate UI for endpoints to allow quick prototyping and sharing with broader team without needing integration (as an alternative deployment option).
- Expand automated testing and evaluation features (scoring, detecting regressions, running experiments).
- Expand AI features, help people write good prompts (beyond giving them the tools to do it).
- Expore multi-modal functionality beyond LLMs.
