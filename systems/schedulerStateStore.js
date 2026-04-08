const path = require("path")

const { getBasePath } = require("./paths")
const { readJsonSafe, writeAtomic } = require("./fileUtils")

const FILE_PATH = path.join(getBasePath(), "scheduler-state.json")

function readState() {
 return readJsonSafe(FILE_PATH, { nextRunAt: {} })
}

function getSchedulerNextRun(key) {
 const state = readState()
 const value = Number(state?.nextRunAt?.[key])
 if (!Number.isFinite(value) || value <= 0) return null
 return value
}

function setSchedulerNextRun(key, timestamp) {
 const ts = Number(timestamp)
 if (!Number.isFinite(ts) || ts <= 0) return

 const state = readState()
 if (!state.nextRunAt || typeof state.nextRunAt !== "object") {
  state.nextRunAt = {}
 }
 state.nextRunAt[key] = Math.floor(ts)
 writeAtomic(FILE_PATH, state)
}

function clearSchedulerNextRun(key) {
 const state = readState()
 if (!state.nextRunAt || typeof state.nextRunAt !== "object") return
 if (!(key in state.nextRunAt)) return

 delete state.nextRunAt[key]
 writeAtomic(FILE_PATH, state)
}

module.exports = {
 getSchedulerNextRun,
 setSchedulerNextRun,
 clearSchedulerNextRun
}
