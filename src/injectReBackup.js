const chalk = require("chalk")
const path = require("path")
const glob = require("glob")
const fsex = require("fs-extra")

async function injectReBackup(electronPath) {
    // find electron
    console.log(chalk.green("electron path:"), path.resolve(electronPath))

    // find asar
    let asarPath = glob.sync("**/app.asar", { cwd: electronPath })[0]
    asarPath = path.resolve(path.join(electronPath, asarPath))
    if (!asarPath) throw new Error("no found app.asar.")
    console.log(chalk.green("asar path:"), path.resolve(asarPath))

    // find backup
    let backupPath = asarPath + ".bak"
    console.log(chalk.green("backupPath:"), backupPath)

    // restore backup
    if (fsex.existsSync(backupPath)) {
        fsex.copySync(backupPath, asarPath)
        console.log(chalk.green("restore backup:"), backupPath)
    }else {
        console.log(chalk.yellow("not find backup:"), backupPath)
    }

    // done
    console.log(chalk.green("\nok finished."))
}
module.exports = injectReBackup
