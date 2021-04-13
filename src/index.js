const os = require("os")
const chalk = require("chalk")
const fsex = require("fs-extra")
const path = require("path")
const inquirer = require("inquirer")

const injectElectron = require("./injectElectron")
const injectReBackup = require("./injectReBackup")
let isWindows = os.platform() == "win32"

async function main() {
    console.clear()
    // console.log("args:", process.argv)
    console.log(
        chalk.cyan("\n\n------------------------------------\n"),
        chalk.cyanBright.bold("[FigmaEX]"),
        chalk.cyan("App Installer"),
        chalk.grey(`on ${isWindows ? "Windows" : "MacOS"}`),
        chalk.cyan("\n------------------------------------\n"),
        chalk.yellow(`Installer Code: https://github.com/Moonvy/FigmaEX_Installer\n\n`),
        chalk.yellow(`Ensure Figma process is closed.（请确保 Figma 应用已经关闭）`)
    )

    let arg = process.argv[2]

    if (arg) {
        figmaPath = arg
    } else if (isWindows) {
        figmaPath = path.join(process.env.USERPROFILE, "AppData", "Local", "Figma")
        if (!fsex.existsSync(figmaPath)) {
            figmaPath = path.join(process.env.USERPROFILE, "AppData", "Roaming", "Figma")
        }

        if (!fsex.existsSync(figmaPath)) {
            if (fsex.existsSync("./Figma.exe")) {
                figmaPath = path.resolve("./")
            }
        }
    } else {
        figmaPath = "/Applications/Figma.app"
    }

    if (!fsex.existsSync(figmaPath)) {
        let tryPath = path.resolve("./Figma")
        if (fsex.existsSync(tryPath)) {
            figmaPath = tryPath
        }
    }

    if (!fsex.existsSync(figmaPath)) {
        throw new Error("not found Figma App on your system.")
    }

    // figma Beta
    let figmaBetaPath

    if (isWindows) {
        figmaBetaPath = path.join(process.env.USERPROFILE, "AppData", "Local", "FigmaBeta")
    } else {
        figmaBetaPath = "/Applications/Figma Beta.app"
    }
    if (fsex.existsSync(figmaBetaPath)) {
        let answers = await inquirer.prompt([
            {
                name: "figmabeta",
                type: "list",
                message: "Found 「Figma Beta」 Do you want to install it in figma「Figma Beta」?（发现 「Figma Beta」是否安装到 「Figma Beta」？）",
                choices: ["1. Figma Beta", `2. Default`]
            }
        ])
        if (answers.figmabeta == "1. Figma Beta") {
            figmaPath = figmaBetaPath
        }
    }

    console.log(chalk.blue("Figma App path:"), figmaPath, "\n")

    let answers = await inquirer.prompt([
        {
            name: "to",
            type: "list",
            message: "select command （选择一个操作）",
            choices: ["1. Start Install（安装）", "2. Restore Backup（还原备份）"]
        }
    ])

    console.log("> ", answers.to)

    if (answers.to == "1. Start Install（安装）") {
        await injectElectron(figmaPath, "FigmaEX", __dirname + "/app.js")
    } else if (answers.to == "2. Restore Backup（还原备份）") {
        await injectReBackup(figmaPath, "FigmaEX", __dirname + "/app.js")
    }

    if (isWindows) await inquirer.prompt([{ name: "any", type: "list", message: "", choices: ["exit"] }])
}

main()
