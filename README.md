# rea-hwa

> [!IMPORTANT]
> **이 저장소는 원작 저장소가 아닙니다.**
> 원작은 [morluto/rea](https://github.com/morluto/rea)(MIT, 공식 사이트 [rea.tools](https://rea.tools/), npm 패키지 [`rea-agents`](https://www.npmjs.com/package/rea-agents))이고,
> 이 저장소는 원작을 바탕으로 게임 리버싱과 대용량 바이너리 분석용 도구를 얹은 **비공식 포크**입니다.
> 원작자와 관계가 없으며, 원작자의 검토나 지원을 받지 않습니다.
> 버그 제보, 기능 요청, 공식 릴리스처럼 원작에 관한 일은 [원작 저장소](https://github.com/morluto/rea)를 이용해 주세요.
>
> **This is not the original repository.** It is an unofficial, independent fork of
> [morluto/rea](https://github.com/morluto/rea) maintained by [@magjangin](https://github.com/magjangin).
> It is not affiliated with or endorsed by the upstream authors. Please report upstream issues there.

## 원작과 다른 점

- **PE 슬라이싱 도구를 추가했습니다:** `tools/pe_slice.py`, `tools/pe-slice.mjs`. Unity `GameAssembly.dll`처럼 10MB가 넘는 PE에서 필요한 함수만 담은 1MB 미만 슬라이스 DLL을 만들어, Ghidra 분석 타임아웃과 메모리 부족을 피합니다.
- **IL2CPP 어셈블리 도구를 추가했습니다:** `tools/il2cpp_asm.py`, `tools/il2cpp-asm.mjs`. Android `libil2cpp.so`, iOS `UnityFramework` 같은 ARM64/x64 바이너리를 `dump.cs`, `script.json` 주석이 달린 어셈블리로 바로 뽑습니다.
- **에이전트 라우팅 지침을 `AGENTS.md`에 넣었습니다:** 큰 PE나 `GameAssembly.dll`은 `open_binary` 전에 슬라이싱부터 하도록 안내합니다.
- **이름과 식별자가 원작과 다릅니다:** 패키지/MCP 서버 키는 `rea-hwa`입니다. `npx rea-agents ...`는 원작 패키지를 설치하므로 이 포크가 아닙니다.
- 그 외 분석 엔진과 MCP 도구는 원작 그대로입니다. 원작 업데이트를 자동으로 따라가지 않습니다.

슬라이싱 도구 사용법은 아래 [rea-hwa 개선 사항](#-specialized-enhancements-in-rea-hwa)과 [tools/README.md](tools/README.md)에 있습니다.

## 라이선스와 출처

원작과 같은 MIT 라이선스입니다. [LICENSE](LICENSE)의 원작 저작권 표시를 그대로 유지합니다. 아래 내용 중 슬라이싱 도구를 제외한 나머지는 원작 [morluto/rea](https://github.com/morluto/rea)의 문서입니다.

---

# 아래는 원작 REA 문서입니다 (Upstream README)

<div align="center">

**English** · [简体中文](docs/readme/README_zh.md) · [繁體中文](docs/readme/README_zh-TW.md) · [日本語](docs/readme/README_ja.md) · [한국어](docs/readme/README_ko.md) · [Türkçe](docs/readme/README_tr.md) · [Русский](docs/readme/README_ru.md) · [Tiếng Việt](docs/readme/README_vi.md) · [ไทย](docs/readme/README_th.md) · [Deutsch](docs/readme/README_de.md) · [Español](docs/readme/README_es.md) · [Français](docs/readme/README_fr.md) · [Українська](docs/readme/README_uk.md) · [Polski](docs/readme/README_pl.md) · [Português (Brasil)](docs/readme/README_pt-BR.md) · [العربية](docs/readme/README_ar.md) · [فارسی](docs/readme/README_fa.md) · [Bahasa Indonesia](docs/readme/README_id.md) · [Italiano](docs/readme/README_it.md)
· [Ελληνικά](docs/readme/README_el.md) · [മലയാളം](docs/readme/README_ml.md) · [Roman Urdu](docs/readme/README_ur-Latn.md) · [Română](docs/readme/README_ro.md) · [Български](docs/readme/README_bg.md)

# REA: Reverse Engineer Anything (Fork: rea-hwa)

### One MCP for reverse engineering across binaries, applications, and runtime behavior.

### Enhanced with Unity IL2CPP & Large Target PE Slicing Tools.

**See a feature you like. Understand how it works, down to the binary level.**

[![GitHub stars](https://img.shields.io/github/stars/morluto/rea?style=flat-square&logo=github)](https://github.com/morluto/rea/stargazers)
[![Monthly npm downloads](https://img.shields.io/npm/dm/rea-agents?style=flat-square&label=npm%20downloads)](https://www.npmjs.com/package/rea-agents)
[![MIT license](https://img.shields.io/badge/license-MIT-f4c430?style=flat-square)](LICENSE)
[![Join the REA Discord](https://img.shields.io/badge/Discord-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/GkcryMnJDM)
[![Follow REA on X](https://img.shields.io/badge/X-000000?style=flat-square&logo=x&logoColor=white)](https://x.com/reatools)
[![Supported platforms: macOS, Windows, and Linux](https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-4493F8?style=flat-square)](docs/getting-started/installation.md)
[![skills.sh](https://skills.sh/b/morluto/rea?style=flat-square)](https://skills.sh/morluto/rea/reverse-engineer-anything)

**[Website](https://rea.tools/) · [Guides](https://rea.tools/guides/) · [Showcases](https://rea.tools/showcase/)**

<a href="https://discord.com/invite/GkcryMnJDM"><img alt="Join the REA community on Discord" src="https://img.shields.io/badge/Join%20us%20on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" height="40"></a>

[Quick start](#quick-start) · [⚡ rea-hwa Enhancements](#-specialized-enhancements-in-rea-hwa) · [Showcases](#showcases) · [How REA works](#how-rea-works) · [What you can analyze](#what-you-can-analyze) · [Build RL environments](#build-rl-environments) · [FAQ](#faq) · [Documentation](#documentation)

<code>npx rea-agents setup</code> <sub>(upstream package — installs the original REA, not this fork)</sub>

</div>

<div align="center">

<br />

<img src="docs/assets/rea-hopper-analysis.png" alt="REA launching its analysis bridge inside Hopper while inspecting a native binary" width="1200" />

<br /><br />

<table aria-label="REA community">
<tr>
<td align="center" width="360">
  <a href="https://discord.gg/GkcryMnJDM">
    <img src="docs/assets/discord.svg" height="42" alt="Discord" /><br />
    <strong>Join the Reverse Engineering Community</strong>
  </a><br />
  <sub>Discord · Q&amp;A · Show and Tell</sub>
</td>
</tr>
</table>

<br />

</div>

---

See a feature in an app that you want in your own product? Ask your agent to investigate it with REA. It can inspect the app without its source code, explain how the feature works, show the evidence, and build a version for your project.

REA connects your agent to tools for inspecting native binaries, JavaScript and Electron apps, .NET assemblies, and websites. You can also use the same tools from your terminal. Analysis runs locally, and results include the evidence and limitations behind each conclusion.

Setup registers REA with your agent and installs matching workflow instructions. Native analysis can use an existing Hopper, Ghidra, IDA or Kuna installation; setup can optionally install Hopper with approval. Static JavaScript analysis needs no native analysis engine.

## ⚡ Specialized Enhancements in `rea-hwa`

`rea-hwa` introduces specialized tooling and routing instructions to overcome disassembly bottlenecks when analyzing large Windows PE targets and Unity IL2CPP games:

### 1. Fast PE Slicing (`tools/pe_slice.py` / `tools/pe-slice.mjs`)

When running REA against massive Windows PE binaries (such as Unity's `GameAssembly.dll`, often 50MB–100MB+), full-binary Ghidra analysis can easily exceed MCP timeouts and exhaust RAM.

- **Minimal Slice Generation**: Extracts a lightweight slice PE (<1MB) with only the requested target functions, unwind `.pdata` chains, direct callee stubs, and RIP-relative data pages.
- **Il2CppDumper Integration**: Automatically embeds method and string names from Il2CppDumper `script.json` into the slice's export table, rendering readable symbols in Ghidra decompilation.
- **Usage**:
  ```bash
  node tools/pe-slice.mjs --dll GameAssembly.dll --script-json script.json --class TargetClass --out slices/TargetClass.dll
  node tools/pe-slice.mjs --dll GameAssembly.dll --script-json script.json --method "TargetClass::TargetMethod" --out slices/TargetMethod.dll
  ```

### 2. Cross-Platform IL2CPP Disassembly (`tools/il2cpp_asm.py` / `tools/il2cpp-asm.mjs`)

- **Direct Instruction Annotation**: Disassembles ARM64 / x64 IL2CPP binaries (ELF, Mach-O, PE) directly without requiring full disassembler sessions.
- **Mobile Support on Windows**: Inspect Android `libil2cpp.so` or iOS `UnityFramework` directly on Windows with annotated calls and strings from `dump.cs` and `script.json`.
- **FairPlay Check**: Includes `--check-encryption` to check iOS Mach-O `cryptid`.
- **Usage**:
  ```bash
  node tools/il2cpp-asm.mjs --binary libil2cpp.so --dump dump.cs --script-json script.json --class PlayerController --out logs/PlayerController.asm
  node tools/il2cpp-asm.mjs --check-encryption Payload/Game.app/Frameworks/UnityFramework.framework/UnityFramework
  ```

### 3. Built-in Agent Routing Guidelines

`AGENTS.md` and `SKILL.md` are pre-configured to guide AI assistants: for PE binaries >10MB or `GameAssembly.dll`, agents automatically slice target functions first, ensuring responsive analysis without context freezes. See [tools/README.md](tools/README.md) for full documentation.

---

## Quick start

**[Get started at rea.tools](https://rea.tools/get-started/)** for step-by-step
instructions by operating system, agent, and analysis provider.

### Connect your agent (MCP)

With [Node.js and npm](docs/reference/supported-targets.md) installed, run this from a trusted
directory outside the project you plan to analyze.

```bash
npx rea-agents setup
```

Choose your agent, review and approve the setup plan, then restart your agent.
Setup backs up existing configuration and adds REA's MCP connection and
investigation skill. See the
[installation guide](docs/getting-started/installation.md) for supported clients,
plugins, manual registration, and troubleshooting.

Try asking your agent:

```text
Understand how search works in the Notes app, show me the evidence, and build a
similar feature for my project.
```

Replace Notes with your target app and the feature you want to understand.

### Use REA from the terminal (CLI)

Inspect an extracted JavaScript/Electron app directory or ASAR:

```bash
npx -y rea-agents@latest analyze-javascript-application /absolute/path/to/app --json
```

The result includes modules, imports, Electron boundaries and their evidence.
Replace the path with your target, such as `"D:/apps/example"` on Windows.

To install the `rea` command for regular use:

```bash
npm install --global rea-agents
rea --help
```

For native analysis, configure a provider first. The
[CLI and Evidence guide](docs/getting-started/cli.md) covers provider selection,
native commands, snapshots, and scripting. For Linux prerequisites, see the
[installation guide](docs/getting-started/installation.md#linux-owned-process-prerequisite).

### Update REA

For a global npm or Bun installation, run the updater and follow its setup
instructions.

```bash
rea update
```

If you use `npx`, refresh your agent setup with:

```bash
npx rea-agents@latest setup
```

Review the setup changes and restart your agent. See
[update and uninstall instructions](docs/getting-started/installation.md#diagnose-update-and-remove)
for package runner options and troubleshooting.

## Showcases

<a href="https://rea.tools/showcase/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/rea-showcases-dark.svg" />
    <img alt="Illustrations of the DX-Ball sound-pan, Notion clipboard-bridge, and TH04 bullet-ring showcases" src="docs/assets/rea-showcases.svg" />
  </picture>
</a>

<table>
<tbody>
<tr>
<td>
<h3>DX-Ball: reconstruct a sound-pan calculation</h3>
<p>Recover a position-to-pan helper from x86 instructions and verify the C reconstruction against 3,205 original-x86 cases and all 63 compiled function bytes.</p>
<a href="https://rea.tools/showcase/dx-ball/">Read the case study</a> ·
<a href="https://github.com/N0zoM1z0/dx-ball">Reconstruction repository</a>
</td>
</tr>
<tr>
<td>
<h3>Notion: trace the Electron clipboard bridge</h3>
<p>Follow the renderer’s clipboard API through preload and IPC into the main process to see how Notion handles rich clipboard data.</p>
<a href="https://rea.tools/showcase/notion/">Read the case study</a>
</td>
</tr>
<tr>
<td>
<h3>TH04: recover a DOS bullet-ring calculation</h3>
<p>Recover fixed and aimed angle calculations from the PC-98 game’s 16-bit instructions and compare the reconstructed C++ with historical compiler output.</p>
<a href="https://rea.tools/showcase/th04/">Read the case study</a> ·
<a href="https://github.com/N0zoM1z0/th04">Reconstruction repository</a>
</td>
</tr>
</tbody>
</table>

If you've used REA on something interesting, we'd love to see it. Share your
case in an [issue](https://github.com/morluto/rea/issues) or a
[pull request](https://github.com/morluto/rea/pulls), including the target,
your question, how REA helped, and what you found.

## How REA works

Your agent uses REA through MCP to inspect a target and trace the relevant code.
It can use the evidence REA returns to ask follow-up questions, explain behavior,
or build and test an implementation. The CLI uses the same workflows.

![REA investigation flow: your agent asks about a local target, REA inspects and traces it using analysis tools, and the agent uses the returned code, references and unknowns to explain, implement and test.](website/public/assets/figures/rea-investigation-flow.svg)

[Open the full-size figure](website/public/assets/figures/rea-investigation-flow.svg).

<a id="current-status"></a>

## What you can analyze

REA covers native binaries, JavaScript and Electron apps, websites, .NET
assemblies, Android apps, firmware, and recorded runtime and network activity.

[Supported targets and requirements](docs/reference/supported-targets.md)

<a id="choosing-a-deep-analysis-provider"></a>

For native decompilation, choose a provider that supports your target format
and host OS. See [choosing a deep analysis provider](docs/reference/supported-targets.md#choosing-a-deep-analysis-provider).

## Build RL environments

Build a local environment from a recorded web session or a Linux desktop app
so an agent can practice a task and check its result.
[Build an RL environment with REA](https://rea.tools/guides/rl-environments/).

## FAQ

<details>
<summary><strong>Which agents can use REA?</strong></summary>

Any agent that supports local MCP servers. Setup configures the
[supported agents](docs/getting-started/installation.md#supported-agents); other clients can use
[manual MCP registration](docs/getting-started/installation.md#mcp-registry).

</details>

<details>
<summary><strong>Do I need a native analysis engine?</strong></summary>

Deep native analysis uses Hopper, Ghidra, IDA or Kuna, depending on the target
and operation. Static JavaScript and .NET inspection work without a native
analysis engine. Setup can install Hopper after approval; Ghidra, IDA and Kuna
use your existing installations. See [provider setup](docs/getting-started/installation.md#hopper)
for the options and their supported targets.

</details>

<details>
<summary><strong>Do I need to start Hopper first?</strong></summary>

REA starts Hopper when an operation needs it. On macOS, a first-run dialog may
ask you to choose demo mode or activate your license. Complete that prompt in the
same user session before your first CLI/MCP operation or unattended job. Open
Hopper manually if needed. See
[Hopper startup and troubleshooting](docs/getting-started/installation.md#launcher-paths-and-troubleshooting).

</details>

<details>
<summary><strong>What does installing the skill from skills.sh do?</strong></summary>

The skill supplies investigation instructions for your agent. Use `npx rea-agents setup`
to register REA's MCP server and install the matching instructions, then restart
your agent. See [skill-only installation](docs/getting-started/installation.md#skill-only-installation).

</details>

<details>
<summary><strong>What code does REA return?</strong></summary>

Native analysis returns pseudocode and assembly. JavaScript/Electron analysis
recovers modules and their relationships. Your agent uses these findings to
write and test an implementation; the [showcases](#showcases) give worked examples.

</details>

<details>
<summary><strong>Does REA upload my app?</strong></summary>

REA analyzes targets locally. Your agent receives the tool results, and its
model provider has its own data policy.

</details>

<details>
<summary><strong>What should I do if I hit a bug?</strong></summary>

Update first; a recent release may already fix it.

For a CLI installed with `npm install --global` or `bun add --global`:

```bash
rea update
```

For agent setup through `npx`:

```bash
npx rea-agents@latest setup
```

If you're using an agent, complete the [setup refresh](#update-rea) and restart
it. Retry the same task. If the problem persists, [open an issue](https://github.com/morluto/rea/issues)
with your REA version, target type, steps to reproduce and error output.

</details>

## Documentation

Start with the website's [worked guides](https://rea.tools/guides/).
For exact options, prerequisites and result contracts:

- [Installation and setup](docs/getting-started/installation.md): agent registration, provider configuration, updates and uninstall.
- [Readiness and troubleshooting](docs/getting-started/installation.md#check-readiness-for-your-task): diagnose one agent or analysis engine.
- [CLI and Evidence](docs/getting-started/cli.md): commands, provider selection, snapshots, import/export and exit statuses.
- [MCP contracts](docs/reference/mcp-contracts.md) and [agent prompts](docs/getting-started/mcp-prompts.md): tool results, sessions and guided investigations.
- [Tool catalog](docs/reference/mcp-contracts.md#generated-catalog): generated inventory of tools, providers and CLI commands.

Report vulnerabilities through [SECURITY.md](SECURITY.md).

## Community & Support

- **Discord** — Ask questions and share what you’re investigating with our passionate community of over 50,000 reverse engineers and builders! [![Join the REA Discord](https://img.shields.io/badge/Join%20Discord-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/GkcryMnJDM)
- **Twitter / X** — Follow [@reatools](https://x.com/reatools) for updates and announcements.
- **Feedback & Ideas** — Want a new feature or support for a file format? [Open a GitHub issue](https://github.com/morluto/rea/issues) or [join our Discord](https://discord.gg/GkcryMnJDM) and let us know.

## Star history

🎉 **400,000 GitHub stars — thank you!**

Thanks to everyone using REA, reporting bugs, requesting features, testing builds, and contributing fixes.

<a href="https://rea.tools/contributors/">
  <img src="website/public/contributors/avatars.png" alt="REA contributors" />
</a>

<a href="https://www.star-history.com/?repos=morluto%2Frea&amp;type=date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=morluto/rea&amp;type=date&amp;theme=dark&amp;legend=top-left" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=morluto/rea&amp;type=date" />
    <img alt="REA GitHub star history" src="https://api.star-history.com/chart?repos=morluto/rea&amp;type=date" />
  </picture>
</a>

## Contributing

We'd love your help with REA! [Open an issue](https://github.com/morluto/rea/issues) to
report a bug or suggest a feature, or [send a pull request](https://github.com/morluto/rea/pulls)
to improve the code or docs.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and checks. See the
[testing guide](docs/development/testing.md) for verification lanes.

## Disclaimer

See [DISCLAIMER.md](DISCLAIMER.md) for responsible-use guidance.

The project's position on illegal or unauthorized use covers all REA versions,
distribution channels, and platforms; each copy retains its applicable licenses.

REA is for lawful research, education, interoperability, software preservation,
and analysis of software you own or are authorized to examine.

## License

[MIT](LICENSE)

REA-authored code is licensed under MIT. Third-party material retains its own
licenses and copyright notices; see
[Third-party notices](THIRD_PARTY_NOTICES.md) for the dependency inventory,
preserved license texts, and external-tool terms.

**You must legally obtain and be authorized to use commercial tools**, including
IDA Pro / Hex-Rays decompilers, Hopper, and JEB, under their applicable
licenses. REA grants no tool license, key, or activation entitlement. Trials and
demos remain subject to vendor terms, including user, feature, automation, and
output sharing restrictions. Cracked copies, stolen keys, unauthorized key
sharing, and bypassing license restrictions are not authorized. This guidance
does not amend MIT or third-party licenses.
