# delete-refs

Interactive CLI for deleting branches and tags on a git remote.

`delete-refs` lists every ref on the remote (except `main`), lets you pick the branches and tags you want gone, and deletes them from the remote in one go.

## Install

```sh
npm install -g delete-refs
```

Or run it directly:

```sh
npx delete-refs
```

## Usage

From inside a git repository:

```sh
delete-refs
```

Select the refs to delete with the interactive prompt and confirm. Each selected branch/tag is deleted on `origin`.
