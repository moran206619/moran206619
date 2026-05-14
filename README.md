# 📦 莫然

> 用于集中存储、管理与归档各类数据资产的 GitHub 仓库

![Active](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📖 简介

本仓库作为统一的数据存储中心，用于归档、版本管理和共享各类结构化/非结构化数据文件。所有数据按类型与时间维度有序组织，便于检索与追溯。

适用于数据备份、数据集分发、跨项目数据共享等场景。

---

## 📁 目录结构

```
data-store/
├── raw/          # 原始数据文件
├── processed/    # 处理后的数据
├── exports/      # 导出/分发数据
├── archive/      # 历史归档数据
├── scripts/      # 数据处理脚本
├── README.md
└── CHANGELOG.md  # 数据变更记录
```

---

## 📊 支持格式

`csv` `josn` `xlsx` `Parquet` `xml` `txt` `yaml` `sqlite` `js` `snippet`

---

## 📋 使用规范

命名规范：`{类别}_{描述}_{YYYYMMDD}.{格式}`

> 每次提交数据时，请在 CHANGELOG.md 中注明数据来源、更新时间与变更说明，保持数据可追溯性。

---

## 🌿 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 主分支，稳定数据 |
| `dev` | 开发/临时数据 |
| `archive/*` | 历史归档 |

---

## 📄 许可证

本仓库数据遵循 **MIT License**，使用前请查阅具体数据集的授权说明。
