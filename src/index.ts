#!/usr/bin/env node

import { intro, isCancel, multiselect, outro, spinner } from "@clack/prompts"
import { execa as baseExeca } from "execa"
import type { Result } from "execa"

const execaOptions = { all: true, reject: false } as const
const execa = baseExeca(execaOptions)

const logError = (message: string, result: Result<typeof execaOptions>) => {
  process.exitCode = 1
  console.error(message)
  console.warn((result.all || result.shortMessage) ?? "error message was blank")
}

const deleteRemoteRefs = async () => {
  intro("Delete Remote Refs")
  const s = spinner()
  s.start("Fetching refs...")

  const lsRemote = await execa`git ls-remote --refs -q`
  s.stop()

  if (lsRemote.failed) {
    logError("An error occurred while fetching refs", lsRemote)
    outro("Exiting...")
    return
  }

  const lines = lsRemote.stdout.split("\n")
  const refs = lines
    .map((line) => line.split("\t")[1])
    .filter((ref): ref is string => Boolean(ref))
    .filter((ref) => !ref.endsWith("/main"))

  if (refs.length === 0) {
    outro("Did not find any additional refs on remote")
    return
  }

  const selectedRefs = await multiselect({
    message: "Select refs to delete on the remote",
    options: refs.map((ref) => {
      // a ref looks like this: refs/heads/feature/123-my-feature
      const parts = ref.split("/")
      const [, refType] = parts
      const refName = parts.slice(2).join("/")
      if (!refType) throw new Error(`Failed to parse refType from: ${ref}`)
      if (!refName) throw new Error(`Failed to parse refName from: ${ref}`)

      let refTypeString: string
      if (refType === "heads") refTypeString = "branch"
      else if (refType === "tags") refTypeString = "tag"
      else refTypeString = refType

      return { value: ref, label: `${refTypeString}: ${refName}` }
    }),
  })

  if (isCancel(selectedRefs)) {
    outro("Exiting...")
    return
  }

  const refsToDelete = selectedRefs.filter((ref) => typeof ref === "string")

  const deletePromises = refsToDelete.map(async (ref) => {
    const result = await execa`git push --no-verify --delete origin ${ref}`
    if (result.failed) logError(`An error occurred while deleting ref: ${ref}`, result)
    else console.info(`Deleted ref: ${ref}`)
  })

  await Promise.all(deletePromises)

  outro("Done!")
}

await deleteRemoteRefs()
