# Commit Message Guidelines

Use concise, descriptive commit messages in conventional style.

## Format

`<type>(<scope>): <summary>`

- Keep summary in imperative mood.
- Keep summary around 50 characters when possible.
- Use lowercase type and scope.

## Types

- `feat`: add user-facing functionality
- `fix`: resolve a bug or regression
- `refactor`: restructure code without behavior change
- `docs`: update documentation only
- `test`: add or update tests
- `chore`: maintenance tasks (deps, build config, tooling)

## Examples

- `feat(auth): add magic link sign-in`
- `fix(api): handle null response in profile endpoint`
- `refactor(ui): split gallery card into subcomponents`
- `docs(readme): document local development setup`