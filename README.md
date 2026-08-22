# EduProof

### Blockchain-Based Verifiable Digital Credential Platform

EduProof is a decentralized academic credential platform designed to make educational credentials **verifiable, tamper-evident, lifecycle-aware, and trustable without relying entirely on centralized verification systems**.

The platform connects universities, students, administrators, and public verifiers through a blockchain-backed credential infrastructure.

Instead of treating a certificate as a static document, EduProof treats it as a **verifiable digital credential with a complete lifecycle**:

> **Issuer Accreditation → Credential Issuance → Student Ownership → Verification → Versioning → Revocation**

---

## Table of Contents

- [Overview](#overview)
- [Problem](#problem)
- [Our Solution](#our-solution)
- [Why EduProof Is Different](#why-eduproof-is-different)
- [Key Features](#key-features)
- [Unique Features](#unique-features)
- [System Architecture](#system-architecture)
- [Platform Roles](#platform-roles)
- [Credential Lifecycle](#credential-lifecycle)
- [Blockchain Design](#blockchain-design)
- [On-Chain vs Off-Chain Data](#on-chain-vs-off-chain-data)
- [Security Model](#security-model)
- [Verification Process](#verification-process)
- [Issuer Authorization](#issuer-authorization)
- [Credential Versioning](#credential-versioning)
- [Revocation](#revocation)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Smart Contract](#smart-contract)
- [Frontend](#frontend)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Project](#running-the-project)
- [Testing the DApp](#testing-the-dapp)
- [Deployment](#deployment)
- [Demo Flow](#demo-flow)
- [Limitations](#limitations)
- [Future Enhancements](#future-enhancements)
- [Selection-Worthy Highlights](#selection-worthy-highlights)
- [Team](#team)
- [License](#license)

---

# Overview

Educational credentials are commonly issued as PDFs, paper certificates, or records stored inside centralized institutional systems.

These approaches create several problems:

- Credentials can be forged or modified.
- Verification can require contacting the issuing institution.
- Centralized databases become critical points of trust and failure.
- Revoked or corrected credentials are difficult to track consistently.
- Students often have limited control over how their credentials are shared.
- Employers and other verifiers need a reliable way to determine whether a credential is authentic and still valid.

EduProof addresses these challenges using blockchain technology, cryptographic verification, decentralized storage, and controlled issuer authorization.

The platform does **not** store sensitive academic information directly on-chain.

Instead, blockchain is used as a **trust and verification layer**, while credential metadata can remain off-chain.

---

# Problem

Traditional academic credential verification is often:

```text
Student
   ↓
Provides Certificate
   ↓
Employer / Institution
   ↓
Contacts University
   ↓
University Checks Database
   ↓
Verification Result