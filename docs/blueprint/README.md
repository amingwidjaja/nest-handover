# NEST76 Handover Engine — Development Guide

This folder contains the **core development documents** for NEST76.

These documents act as the **single source of truth** for the system.

Purpose:

anti bingung
anti lupa
no tipu-tipu

---

# Folder Structure

docs

README.md
NEST76_00_PROJECT_ROOT.md
NEST76_01_CONCEPT.md
NEST76_02_SYSTEM_SKELETON.md
NEST76_03_DATABASE_SCHEMA.md
NEST76_04_BUILD_CHECKLIST.md

---

# Document Roles

## PROJECT ROOT

Defines the **identity of the project**.

Contains:

* product name
* tagline
* core purpose
* Mode 0 scope

When continuing development in a new environment, this file should be shared first.

---

## CONCEPT

Defines the **philosophy of the product**.

Prevents the system from drifting into something overly complex.

Contains:

* human behavior model
* product tone
* design principles

---

## SYSTEM SKELETON

The **visual blueprint** of the system.

Contains:

* screen flow
* user interaction flow
* system status transitions

If confused about system structure, open this file.

---

## DATABASE SCHEMA

Defines the **database structure**.

Contains:

* tables
* fields
* relations

All database changes must be reflected here.

---

## BUILD CHECKLIST

Defines **development tasks**.

Tasks are grouped by phases and should be checked when completed.

Example:

[ ] feature not built
[x] feature completed

---

# Development Rules

PROJECT_ROOT rarely changes
CONCEPT rarely changes
SYSTEM_SKELETON rarely changes
DATABASE_SCHEMA changes only when structure changes
BUILD_CHECKLIST updates frequently

---

# Resume Development

If development continues in another session, provide these files:

NEST76_00_PROJECT_ROOT.md
NEST76_02_SYSTEM_SKELETON.md
NEST76_04_BUILD_CHECKLIST.md

These allow development to continue immediately.

---

# Product Tagline

Tanda terima digital gratis.
No tipu-tipu.