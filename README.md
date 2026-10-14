# 🎡 Pixel Name Wheel · 像素点名转盘

**A free bilingual random student picker with a retro arcade twist.**  
**一款自带街机音效的中英双语课堂随机点名转盘。**

**[▶ Try the wheel / 立即体验](https://shishiapcs.github.io/pixel-name-wheel/)** · [English](#english) · [中文说明](#中文说明) · [Report a problem / 反馈问题](https://github.com/shishiAPCS/pixel-name-wheel/issues)

Turn classroom participation into a mini arcade game: spin the wheel, hear the gears click, and watch the pixel-art drill land on a randomly selected student.

让课堂点名像玩小游戏一样有仪式感：转盘飞转、齿轮咔嗒作响，像素钻头出击，看看今天谁被点中！

---

## English

### Why Pixel Name Wheel?

Pixel Name Wheel is a browser-based **random name picker and spinning wheel for teachers**. It's designed to make classroom Q&A, speaking practice, presentations, and warm-ups a little more fun—without losing control of attendance or repeated picks.

### Features

- **Fair random picks:** Every eligible student has an equal chance of being chosen.
- **No repeats within a round:** Selected students are excluded from subsequent draws until the round is reset.
- **Attendance-aware:** Mark students absent to exclude them from the draw.
- **Multiple classes:** Create and switch between separate class rosters.
- **Easy roster setup:** Paste names (one per line or comma-separated) or import `.txt` / `.json` files.
- **Undo and history:** Review previous picks, undo the last pick, or reset a round.
- **Retro arcade experience:** Pixel-art wheel and drill, mechanical clicks, impact effects, and an 8-bit winner jingle.
- **English / 简体中文:** Switch languages at any time. Simplified Chinese is the default for first-time visitors.
- **Sound control:** Mute or enable effects independently of the language setting.
- **No account or installation required:** Open the website in a modern browser.

### Get started

1. **[Open Pixel Name Wheel](https://shishiapcs.github.io/pixel-name-wheel/).**
2. Select **Teacher Panel** to create a class and enter your students' names.
3. Mark absent students when needed.
4. Return to the wheel and press **SPIN**.
5. After the winner is revealed, press **SPIN AGAIN**. Use **Reset** in the Teacher Panel to start a fresh round.

**Tip:** For classroom projection, open the browser in full screen. Use the language and sound buttons next to the Teacher Panel button.

### How selection works

The app randomly selects **one student from those who are present and have not yet been picked in the current round**. The wheel animation then lands on that student. The animation does not determine the outcome.

### Privacy and saved data

Class rosters, attendance, and pick history are stored in your browser's **localStorage**, not in an online account or database. They are not automatically synced between browsers or devices. Clearing this site's browser data can erase them, so keep a separate copy of your class list.

Use appropriate care when entering real student information, especially on shared computers. The page may load its display font from Google Fonts.

### Run locally / Host your own copy

This is a static HTML, CSS, and vanilla JavaScript app—**no build tools, backend, or framework required**.

```bash
# From the project directory
python3 -m http.server 8000
```

Open `http://localhost:8000`. To publish your own copy, enable **GitHub Pages → Deploy from a branch → main / (root)** in your repository settings.

---

## 中文说明

### 这是个什么工具？

**Pixel Name Wheel（像素点名转盘）** 是给老师准备的免费网页点名工具。它把随机抽人做成了复古街机小游戏：转盘越转越慢，像素钻头“咔！”地命中一位同学。课堂提问、口语练习、展示汇报、热身互动，都可以用它来决定谁先上场。

### 有哪些功能？

- **公平随机：** 每位符合抽选条件的同学，被抽中的概率相同。
- **一轮不重样：** 已抽中的同学暂时退出候选池；新一轮可以重新开始。
- **出勤管理：** 请假的同学标记为缺席，本轮就不会抽到。
- **多班级切换：** 不同班级各用各的名单。
- **名单导入：** 可以直接粘贴姓名（每行一人或用逗号分隔），也支持 `.txt`、`.json` 文件。
- **记录与撤销：** 查看抽选历史、撤销上一抽、一键重置本轮。
- **街机仪式感：** 像素转盘、机械钻头、齿轮声、命中特效、8-bit 小音效，一应俱全。
- **中英双语：** 首次打开默认简体中文；随时切换英文，不影响正在进行的抽选。
- **音效开关：** 想热闹就开，想安静就关。
- **打开即用：** 无需注册、安装 App 或搭建服务器。

### 三步上手

1. 打开 **[像素点名转盘](https://shishiapcs.github.io/pixel-name-wheel/)**，进入「教师后台」，创建班级并录入名单。
2. 根据当天情况标记缺席，然后返回转盘，点击「开始点名」。
3. 看看钻头命中谁！点击「再来一位」继续抽选；本轮结束后可以在教师后台重置。

**小技巧：** 投屏上课时建议全屏显示。右下角可以切换中英文，也可以单独控制音效。

### 抽选公平吗？

每次抽选会先从**出勤且本轮尚未被抽中过的同学**中随机选出一位，再让转盘动画停到对应名字上。也就是说，抽选结果由随机逻辑决定，而不是靠钻头动画“碰运气”。

### 名单保存在哪里？

班级名单、出勤状态和抽选历史保存在当前浏览器的 **localStorage（本地存储）** 中，不依赖在线账户或云端数据库，也不会自动跨设备同步。

如果清除了这个网站的浏览器数据，名单和记录可能丢失。建议自己留一份班级名单备份；在公用电脑上使用时，也请注意学生信息的隐私。页面字体可能通过 Google Fonts 加载。

### 本地运行与自行部署

项目只使用 HTML、CSS 和原生 JavaScript，**不需要安装依赖或配置后端**。

在项目文件夹中打开终端，执行：

```bash
python3 -m http.server 8000
```

然后在浏览器访问 `http://localhost:8000`。如需发布自己的版本，可使用 GitHub Pages，在仓库 **Settings → Pages** 中选择从 `main` 分支的根目录部署。

---

## Project files / 项目文件

| File | Purpose / 用途 |
| --- | --- |
| `index.html` | App structure / 页面结构 |
| `style.css` | Core interface styles / 基础界面样式 |
| `app.js` | Rosters, attendance, random selection, and history / 班级、出勤、随机抽选与记录 |
| `wheel.css` | Arcade wheel styling / 街机转盘样式 |
| `wheel.js` | Wheel animation, sounds, and bilingual interface / 转盘动画、音效与双语界面 |
| `.nojekyll` | Publish static files directly on GitHub Pages / 直接发布静态文件 |

## Feedback / 反馈与建议

Found a bug or have an idea? [Open an issue](https://github.com/shishiAPCS/pixel-name-wheel/issues).  
发现问题，或者有希望加入的功能？欢迎通过 [GitHub Issues](https://github.com/shishiAPCS/pixel-name-wheel/issues) 留言。

Created by **Mr. Mou** for everyday classroom use. Inspired by the energy of classic handheld arcade microgames.  
由 **牟老师** 为日常课堂制作，视觉灵感来自经典掌机小游戏WarioWare。


