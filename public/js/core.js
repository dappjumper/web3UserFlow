window.d97 = {
    data: {
        showAccessToken: false,
        scanningQR: false,
        dash: "home",
        QR_READY: false,
        QR_LOADING: false,
        QRWasGenerated: false
    },
    toObject: (js) => {
        try {
            return JSON.parse(js)
        } catch (e) {
            return false
        }
    },

    lockModal: (modal) => {
        d97.appendClass('[modal][' + modal + ']', 'locked')
    },
    unlockModal: (modal) => {
        d97.removeClass('[modal][' + modal + ']', 'locked')
    },

    appendClass: (identifier, className) => {
        var elements = document.querySelectorAll(identifier);
        for (var i in elements) try {
            elements[i].className = elements[i].className + " " + className;
        } catch (e) {}
    },
    removeClass: (identifier, className) => {
        var elements = document.querySelectorAll(identifier);
        for (var i in elements) try {
            elements[i].className = elements[i].className.replace(' ' + className, '');
        } catch (e) {}
    },
    accessTokenSubmit: () => {
        var code = document.querySelector('[access-token]').value;
        code = code.replace('\n', '').replace(' ', '')
        code = atob(code);
        var address = code.slice(0, 42);
        var token = code.replace(address, '');
        localStorage.setItem('d97_token', token);
        localStorage.setItem('d97_address', address);
        d97.checkLogin(true)
    },

    requestSignature: async (string, callback) => {
        try {
            var hashed = web3.utils.fromUtf8(string);
            web3.eth.personal.sign(hashed, d97.data.metamaskAddress, (err, data) => {
                if (!err && data) {
                    callback({
                        signature: data
                    })
                } else {
                    callback({
                        error: "SIGNATURE_FAILED"
                    })
                }
            });
        } catch (e) {
            callback({
                error: "SIGNATURE_FAILED"
            })
        }
    },
    register: (string) => {
        d97.data.status = "Please sign the registration message"
        d97.requestSignature(string, (result) => {
            if (!result.error) {
                //Let's create our new thing!
                d97.data.status = "Creating account..."
                d97.api.post('/api/user/register', (response) => {
                	response = JSON.parse(response)
                    if (!response.error) {
                        d97.login(response.signatureRequest)
                    } else {
                        d97.data.status = "Registration failed"
                        d97.unlockModal('metamaskConnect')
                    }
                }, {
                    signature: result.signature
                })
            } else {
                //Let's see here...
                d97.data.status = "Signature was not signed, please try again."
                d97.unlockModal('metamaskConnect')
            }
        })
    },
    login: (string) => {
        d97.data.status = "Please sign the login message"
        d97.requestSignature(string, (result) => {
            if (!result.error) {
                //Let's create our new thing!
                d97.data.status = "Logging in..."
                d97.api.post('/api/user/login', (response) => {
                    response = JSON.parse(response)
                    if (!response.error) {
                        d97.isLoggedIn = true;
                        localStorage.setItem('d97_token', response.token);
                        localStorage.setItem('d97_address', response.address);
                        window.location.hash = "/dashboard"
                        d97.data.status = "Requesting information"
                        d97.getInitial();
                    } else {
                        d97.urlClean();
                        d97.data.status = "Login failed"
                        d97.unlockModal('metamaskConnect')
                    }
                }, {
                    signature: result.signature
                })
            } else {
                //Let's see here...
                d97.data.status = "Signature was not signed, please try again."
                d97.unlockModal('metamaskConnect')
            }
        })
    },
    metamaskLogin: async () => {
        d97.lockModal('metamaskConnect');
        d97.data.status = "Requesting nonce"
        d97.api.get('/api/user/nonce', (response) => {
            response = JSON.parse(response)
            if (!response.error) {
                d97.login(response.signatureRequest)
            } else {
                d97.register(response.signatureRequest);
            }
        })
    },
    connect: async (method) => {
        if (method == "metamask") {
            d97.data.status = "Please connect with MetaMask"
            if (typeof web3 !== 'undefined') {
                web3 = new Web3(web3.currentProvider);
                d97.interval = setInterval(() => {
                    if (ethereum.selectedAddress) {
                        if (ethereum.selectedAddress[1] == 'x') {
                            d97.data.metamaskAddress = ethereum.selectedAddress;
                        }
                    }
                }, 500)
                try {
                    await ethereum.enable();
                    d97.data.status = ""
                    d97.modal(method + 'Connect');
                } catch (e) {
                    d97.data.status = "MetaMask was denied"
                    d97.modal('connect', true)
                }
            } else {
                d97.data.status = "Please install MetaMask or use Access-Token login"
            }
        }
    },
    logout: () => {
        localStorage.removeItem('d97_token')
        localStorage.removeItem('d97_address')
        d97.urlClean();
        d97.data.modal = "";
        d97.data.status = "";
        d97.getInitial();
    },
    urlAppend: (modal) => {
        window.history.pushState(modal, modal, '/#/' + modal);
    },
    urlClean: () => {
        window.history.pushState(false, false, '/')
    },
    setUrlModal: () => {
        if (window.location.hash.includes('#/')) {
            var trail = window.location.hash.replace('#/', '').split('/');
            if (trail[0]) d97.modal(trail[0]);
            if (trail[1]) d97.dashButton(trail[1]);
        }
    },
    modal: (next, force) => {
        // Changes the modal only if current modal value is different from request
        var nexts = (next != d97.data.modal ? d97.data.modal = next : d97.data.modal = '');
        if (nexts) {
            if (nexts.includes('dashboard')) d97.urlAppend(nexts);
            d97.data.modal = nexts;
        } else {
            if (force) {
                if (next.includes('dashboard')) d97.urlAppend(next);
                d97.data.modal = next
            } else {
                d97.urlClean();
            }
        }
    },
    dashButton: (n) => {
        if (n != d97.data.dash) d97.urlAppend('dashboard' + (n == 'home' ? '' : '/' + n));
        d97.data.dash = n;
        if (typeof d97.data[n] == 'undefined') {
            d97.data[n] = {}
            if (d97.fetch[n]) d97.fetch[n]();
        }
    },
    fetch: {
        products: () => {
            d97.data.products = {
                loading: true,
                owned: [],
                available: [],
                hello: "<b>Coming soon:</b><br/>Telegram Group Butler<br/>Telegram Campaign Manager<br/>Smart Contract Suite",
                start: new Date().getTime()
            }
            setTimeout(() => {
                d97.data.products.end = new Date().getTime();
                d97.data.products.loading = false;
            }, 0)
        },
        groups: () => {
            d97.data.groups = {
                hello: "<b>Coming soon:</b><br/>Companies<br/>Cryptocurrency Payment System"
            }
            d97.data.groups.loaded = true;
        }
    },
    closeModals: (e) => {
        if (e.target.tagName == 'LOGO' || e.target.className == "canCloseModals" || e.target.tagName == 'HEADER') {
            try {
                d97.data.modal = ''
                d97.urlClean();
            } catch (e) {}
        }
    },
    checkScrollStatus: (distance, callback) => {
        callback(document.body.scrollTop >= distance || document.documentElement.scrollTop >= distance)
    },
    bindUI: () => {
        var databound = document.querySelectorAll('header, footer, [databound]');
        for (var d in databound) {
            if (databound[d].innerHTML) rivets.bind(databound[d], d97.data);
        }

    },
    checkLogin: (force) => {
        d97.data = JSON.parse(d97.initial)
        d97.bindUI();
        var address = localStorage.getItem('d97_address');
        var token = localStorage.getItem('d97_token')
        if (address && token) {
            d97.data.isLoggedIn = true;
            d97.getInitial(force);

        } else {
            history.pushState("", document.title, window.location.pathname +
                window.location.search);
            d97.data.isLoggedIn = false;
        }
    },
    getInitial: (force) => {
        d97.api.post('/api/user/private/information', (response) => {
            response = JSON.parse(response)
            if (!response.error) {
                d97.data.isLoggedIn = true;
                d97.data.home = {
                    request: new Date().getTime()
                }
                d97.data.accessToken = btoa(response.address + localStorage.getItem('d97_token'))
                d97.data.user = response;
                d97.data.user.token = localStorage.getItem('d97_token')
                d97.data.status = "Success!"
                d97.unlockModal('metamaskConnect');
                if (force) {
                    window.location.hash = "#/dashboard"
                }
                d97.setUrlModal();
            } else {
                if (window.location.hash.includes('dashboard')) d97.urlClean();
                d97.data.status = "Login failed"
                d97.data.isLoggedIn = false;
                d97.unlockModal('metamaskConnect')
            }
        })
    },
    boot: () => {
        if (window.location.protocol == 'http:' && window.location.href.includes('dappjump.io')) {
            window.location.protocol = 'https:';
        } else {
            document.querySelector('body').style = ""

            rivets.formatters.is = (value, arg) => {
                return (value == arg)
            }

            rivets.formatters.toLocalTime = (value, arg) => {
                return new Date(value).toLocaleString()
            }

            var modals = document.querySelector('[modal]');
            for (var m in modals) {
                if (modals[m]) modals[m].onclick = d97.closeModals;
            }

            setInterval(() => {
                d97.checkScrollStatus(64, (status) => {
                    d97.data.isScrolled = status
                })
            }, 500);


            d97.initial = JSON.stringify(d97.data)
            d97.checkLogin();

            //Warning silencer
            if (typeof ethereum != 'undefined') ethereum.autoRefreshOnNetworkChange = false;
        }
    },
    api: {
        get: (url, callback) => {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    callback(this.responseText)
                } else {
                    if (this.readyState == 4 && this.status != 200) {
                        callback(false)
                    }
                }
            };
            xhttp.open("GET", url, true);
            xhttp.setRequestHeader('Public-key', d97.data.metamaskAddress);
            if (localStorage.getItem('d97_token')) xhttp.setRequestHeader('token', localStorage.getItem('d97_token'));
            xhttp.send();
        },
        post: (url, callback, payload) => {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    callback(this.responseText)
                } else {
                    if (this.readyState == 4 && this.status != 200) {
                        callback(false)
                    }
                }
            };
            xhttp.open("POST", url, true);
            xhttp.setRequestHeader('Public-key', d97.data.metamaskAddress);
            if (localStorage.getItem('d97_token')) xhttp.setRequestHeader('token', localStorage.getItem('d97_token'));
            if (typeof payload != 'object') {
                xhttp.send('');
            } else {
                xhttp.setRequestHeader("Content-Type", "application/json");
                xhttp.send(JSON.stringify(payload));
            }
        }
    }
}

window.onload = d97.boot;

const loadScript = (url, callback) => {
    var script = document.createElement("script")
    script.type = "text/javascript";
    if (script.readyState) { // only required for IE <9
        script.onreadystatechange = function () {
            if (script.readyState === "loaded" || script.readyState === "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else { //Others
        script.onload = function () {
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}


// call the function...

const scanQR = () => {
    let scan = () => {
        try {
            let scanner = new Instascan.Scanner({
                video: document.getElementById('preview'),
                mirror: false
            });
            scanner.addListener('scan', function (content) {
                document.querySelector('[access-token]').value = content;
                d97.data.scanningQR = false;
                scanner.stop();
                d97.accessTokenSubmit();
            });

            document.querySelector('.videoWrap').onclick = () => {
                d97.data.scanningQR = false;
                scanner.stop();
            }

            scanner.addListener('active', function () {
                d97.data.scanningQR = true;
            })

            Instascan.Camera.getCameras().then(function (cameras) {
                if (cameras.length > 0) {
                    d97.data.scanningQR = true;
                    scanner.start(cameras[cameras.length - 1]).catch(function (e) {
                        d97.data.scanningQR = false;
                    });
                } else {
                    d97.data.scanningQR = false;
                }
            }).catch(function (e) {
                d97.data.scanningQR = false;
            });


        } catch (e) {

        }
    }

    if (d97.data.QR_READY) {
        scan();
    } else {
        d97.data.QR_LOADING = true;
        loadScript('/js/adapter.js', () => {
            loadScript('/js/qrscan.js', () => {
                d97.data.QR_LOADING = false;
                d97.data.QR_READY = true;
                scan();
            })
        });
    }
}

var scriptLoaded = false;
const generateTheQr = () => {
    d97.data.QRWasGenerated = true;
    var qrfield = document.getElementById("qrcode");
    qrfield.innerHTML = ""; //Clean
    new QRCode(qrfield, d97.data.accessToken);
}
const generateQR = () => {
    if (scriptLoaded == true) {
        generateTheQr();
    } else {
        loadScript('/js/qr.js', generateTheQr)
    }
}