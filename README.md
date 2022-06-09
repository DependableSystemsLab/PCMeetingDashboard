# Program Committee Meeting Dashboard

This web-app is used during a Program Committee meeting to keep track of papers being reviewed, and **it is meant to be displayed on a screen using a projector**. This app **should be used exclusively by the PC chair**, as the app will **contain confidential information**.

It provides the following features:

* Announce PC conflicts before each paper
* Keep track of the time
* Keep track of the decision

You can [check out the demo here](https://dependablesystemslab.github.io/PCMeetingDashboard).

![screenshot](screenshot.png)


## How to use

The [`dist`](dist) directory contains the compiled version of the web-app, which can be used right away. The `dist` directory contains the following:

```
/app/
    /bundle.js
/data/
    /manifest.json
    /pcinfo.json
    /order{N}.json
/index.html
```

* [`index.html`](dist/index.html) is the entry point of the web application
* [`data`](dist/data) directory should be updated to use the data downloaded from HotCRP system.
    * [`data/manifest.json`](dist/data/manifest.json) contains the mapping of files, specifying which file to use for the program committee list and the list of papers.
    * [`data/pcinfo.json`](dist/data/pcinfo.json) is a JSON file containing basic information about the PC members. This file is used to map the PC committe emails to their first and last names. If you use a different file, `manifest.json` must be updated to point to that file.
    * Each `data/order{N}.json` contains the list of papers to discuss in a session. This JSON file is downloaded directly from the HotCRP website. We do not disclose further details here due to privacy and security concerns. If you have any questions, send an email to the repository owner.
* [`app`](dist/app) contains the compiled React app. The user does not need to update anything here.

After updating the contents in the `data` directory, simply serve the `dist` directory as a web-app. **Please read the security warning below** before you use it.

### Security Warning

This web-app has **absolutely no security mechanisms** in place, therefore **must be used as a local web page** by serving it at `localhost` or `127.0.0.1`. **Do not even serve it in a Local Area Network** as other people in the network will be able to access the page.

**It is extremely important** to follow this practice, as *all the data and code for this web-app is on the client-side*, and it contains sensitive information.

Additionally, the decision data are saved using `window.localStorage`, which means that the data persists in the disk. Make sure to clear the data after the PC meeting is over, to prevent any leaks when using a shared PC.


## How to customize the app

This section is relevant only if you want to customize the application. If you simply want to use it, serving the `dist` directory as a local webpage should be enough.

This web-app is a basic React App. You will need to install the dependencies before you can get into development. With a working Node.js (v10+) installation, first install the dependencies with the command `npm install`.

The project is organized as the following:

```
/data/
/dist/
/src/
    /components/
        /Dashboard.jsx
    /index.html
    /index.jsx
/webpack.dev.js
/webpack.prod.js
/package.json
```

[`src`](src) directory contains the React App. [`src/index.jsx`](src/index.jsx) is the entry point of the web-app, and it first fetches `manifest.json` to figure out the file paths for the data files. Subsequently, it fetches the committee and the papers data, then initializes the React App. The entire front-end application is defined in [`src/components/Dashboard.jsx`](src/components/Dashboard.jsx).

### Commands

* `npm run dev` to start the Webpack Dev Server, with hot reloading enabled.
* `npm run build` to compile the React App
* `npm start` to serve the `dist` directory at `localhost:3000`


## License

MIT
