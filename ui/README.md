# ui

- [1. Overview](#1-overview)
- [2. Installation](#2-installation)
- [3. Usage](#3-usage)
- [4. Tests](#4-tests)


## 1. Overview
A single-page application (SPA) bootstrapped by [Create React App](https://github.com/facebook/create-react-app). It provides the interface for hosting and playing quizzes. A websocket connection is established with the server to facilitate bi-directional communication in order to play a quiz. If the server terminates mid-quiz, the client will attempt to reconnect.

The app is fully-responsive to layout changes, providing both a mobile and desktop view.

Noteworthy libraries are:

Library | Purpose
--------|--------
 [redux](https://react-redux.js.org/) | Client-side state management
 [react-router](https://reactrouter.com/) | Clide-side routing


## 2. Installation
This project was developed using node v16. Make sure you have this version or newer installed.

## 3. Usage
To start the server in dev mode, first configure `.env.development`, then run:
```bash
npm start
```
The server will launch on `http://localhost:3000` with hot-reloading enabled.

To build a production version, first configure `.env.production` then run:
```bash
npm run build
```
Which can then be served by a static server with:
```bash
npm install -g serve
serve -s build
```

## 4. Tests
The tests can be run with:
```bash
CI=true npm test
```
Or to run in interactive watch mode:
```bash
npm test
```
