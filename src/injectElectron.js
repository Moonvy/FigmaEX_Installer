const chalk = require("chalk")
const asar = require("asar")
const glob = require("glob")
const fsex = require("fs-extra")
const os = require("os")
const path = require("path")
const rcompare = require("semver/functions/rcompare.js")
async function injectElectron(electronPath, key, addPath) {
    let isWindows = os.platform() == "win32"

    // find electron
    console.log(chalk.green("electron path:"), path.resolve(electronPath))

    // find asar
    let asarPaths = glob.sync("**/app.asar", { cwd: electronPath })
    if (asarPaths.length == 0) throw new Error("no found app.asar.")

    // find latest asar
    if (isWindows) {
        asarPaths = asarPaths.map(x => {
            let finPath = path.resolve(path.join(electronPath, x))
            let reg = /\\app-([0-9\.]+?)\\resources/
            let ver = finPath.match(reg)[1] ?? "0.0.0"
            return { ver, path: finPath }
        })

        asarPaths = asarPaths.sort((a, b) => rcompare(a.ver, b.ver))

    } else {
        asarPaths = asarPaths.map(x => {
            let finPath = path.resolve(path.join(electronPath, x))
            return { birthtimeMs: fsex.statSync(finPath).birthtimeMs, path: finPath }
        })
        asarPaths = asarPaths.sort((a, b) => a.birthtimeMs - b.birthtimeMs)
    }
    if (asarPaths.length > 1) {
        console.log(chalk.green("multiple versions:"), asarPaths)
    }
    let asarPath = asarPaths[0].path
    console.log(chalk.green("asar path:"), path.resolve(asarPath))

    // temp path
    let temp = os.tmpdir()
    temp = path.join(temp, "InjectElectron_TEMP")
    fsex.removeSync(temp)
    fsex.ensureDirSync(temp)
    console.log(chalk.green("temp path:"), temp)

    // fix figma asar
    let fixPath = asarPath + ".unpacked/_codesign "
    if (!fsex.existsSync(fixPath)) {
        console.log(chalk.green("fix path:"), fixPath)
        fsex.writeFileSync(fixPath, " ")
        console.log(chalk.green("fix path write:"), fixPath)
    }

    // extract asar
    let unpackPath = path.join(temp, "unpack")
    console.log(chalk.green("extractAll..."), asarPath, "=>", unpackPath)
    asar.extractAll(asarPath, unpackPath)
    console.log(chalk.green("extractAll done."))

    // find vendor
    let vendorPath = path.join(unpackPath, "web_app_binding_renderer.js")
    let vendorText = fsex.readFileSync(vendorPath).toString()
    console.log(chalk.green("vendo path:"), vendorPath)

    //  remove old
    if (new RegExp(`\/\/<INJECT_START###_${key}>`, "").test(vendorText)) {
        let reg = new RegExp(`\/\/<INJECT_START###_${key}>[\\W\\w]+?\/\/<INJECT_END###_${key}>`, "mg")

        console.log(reg)
        vendorText = vendorText.replace(reg, "")
        console.log(chalk.green("vendo remove old:"), key)
    }

    // backup
    let backupPath = asarPath + ".bak"
    if (!fsex.existsSync(backupPath)) {
        fsex.copySync(asarPath, backupPath)
        console.log(chalk.green("backup:"), backupPath)
    }

    //  overwrite
    let jsPath = path.resolve(addPath)
    let addText = fsex.readFileSync(jsPath).toString("base64")

    addText = `
window.addEventListener("DOMContentLoaded", () => {
    electron_1.webFrame.executeJavaScript(
          Buffer.from("${addText}", 'base64').toString('utf-8')
          );
}); `

    console.log(chalk.green("add file size:"), addText.length)
    vendorText += "\n\n" + `//<INJECT_START###_${key}>\n${addText}\n//<INJECT_END###_${key}>`
    fsex.writeFileSync(vendorPath, vendorText)
    console.log(chalk.green("overwrite:"), vendorPath)

    //  repack
    let repackPath = path.resolve(temp, "app.asar")
    await asar.createPackage(unpackPath, repackPath)
    console.log(chalk.green("repack:"), repackPath)

    fsex.copySync(repackPath, asarPath)
    console.log(chalk.green("overwrite:"), repackPath, "=>", asarPath)

    return
    // clear temp
    fsex.removeSync(temp)
    console.log(chalk.green("clear:"), temp)

    // done
    console.log(chalk.green("\nok finished."))
}

module.exports = injectElectron
