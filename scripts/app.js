const userModel = firebase.auth();
const dbURL = 'https://exam-78599-default-rtdb.europe-west1.firebasedatabase.app/destinations.json';
const errMsg = document.querySelector('.errorBox');
const goodMsg = document.querySelector('.infoBox');
const loading = document.querySelector('.loadingBox');


const app = Sammy('#container', function() {
    this.use('Handlebars', 'hbs');

    //GET QUERIES -- START
    this.get('/', function(context) {
        showLoading()
        extendedContext(context)
            .then(function() {
                fetch(dbURL)
                    .then(r => r.json())
                    .then(offers => {
                        try {
                            Object.keys(offers).forEach(key => {
                                offers[key].productId = key;
                            })
                            context.offers = offers;

                        } catch (error) {

                        } finally {
                            hideLoading();
                            this.partial('./templates/home.hbs')
                        }
                    })
            });
    });
    this.get('/home', function(context) {
        showLoading()
        extendedContext(context)
            .then(function() {
                fetch(dbURL)
                    .then(r => r.json())
                    .then(offers => {
                        try {
                            Object.keys(offers).forEach(key => {
                                offers[key].productId = key;
                            })
                            context.offers = offers;
                        } catch (error) {

                        } finally {
                            hideLoading();
                            this.partial('/templates/home.hbs')
                        }
                    })
            });
    });

    this.get('/register', function(context) {
        showLoading();
        extendedContext(context)
            .then(function() {
                hideLoading();
                this.partial('/templates/register.hbs')
            });
    });

    this.get('/login', function(context) {
        showLoading();
        extendedContext(context)
            .then(function() {
                hideLoading();
                this.partial('/templates/login.hbs')
            })
    });

    this.get('/create', function(context) {
        showLoading();
        extendedContext(context)
            .then(function() {
                hideLoading();
                this.partial('/templates/create.hbs')
            })
    });

    this.get('/edit-offer/:id', function(context) {
        showLoading();
        const { id } = context.params;
        context.productId = id;
        fetch(`https://exam-78599-default-rtdb.europe-west1.firebasedatabase.app/destinations/${id}.json`)
            .then(res => res.json())
            .then(data => {
                extendedContext(context)
                    .then(function() {
                        this.partial('/templates/edit.hbs')
                            .then(() => {
                                const { destination, city, duration, departureDate, imgUrl } = data;
                                const destinationElement = document.getElementById('destination');
                                const cityElement = document.getElementById('city');
                                const durationElement = document.getElementById('duration');
                                const departureDateElement = document.getElementById('departureDate');
                                const imgUrlElement = document.getElementById('imgUrl');
                                destinationElement.value = destination;
                                cityElement.value = city;
                                durationElement.value = duration;
                                departureDateElement.value = departureDate;
                                imgUrlElement.value = imgUrl;
                                hideLoading();
                            });
                    });
            });
    });
    this.get('/details/:id', function(context) {
        showLoading();
        const { id } = context.params;
        fetch(`https://exam-78599-default-rtdb.europe-west1.firebasedatabase.app/destinations/${id}.json`)
            .then(res => res.json())
            .then(data => {
                let { destination, duration, departureDate, city, from, imgUrl } = data;
                context.destination = destination;
                context.duration = duration;
                context.departureDate = departureDate;
                context.city = city;
                context.productId = id;
                context.imgUrl = imgUrl;
                try {
                    let userId = getUserData().uid;
                    if (from == userId) {
                        context.IsItMine = true;
                    } else {
                        console.log(data.clients);
                        if (data.clients[userId]) {
                            context.imInTheClientList = true;
                        }
                    }
                } catch (error) {
                    context.IsItMine = false;
                }
                extendedContext(context)
                    .then(function() {
                        hideLoading();
                        this.partial('/templates/details.hbs')
                    });
            });
    });

    this.get('/logout', function(context) {
        userModel.signOut()
            .then(r => {
                clearUserData();
                showNotification(goodMsg, 'Logout successful.')
                this.redirect('/home');
            })
            .catch(e => {
                showNotification(errMsg, e)
            })
    });
    this.get('/delete-offer/:offerId', function(context) {
        showLoading();
        let { offerId } = context.params;
        fetch(`https://exam-78599-default-rtdb.europe-west1.firebasedatabase.app/destinations/${offerId}.json`, {
                method: 'DELETE'
            }).then(res => {
                hideLoading();
                showNotification(goodMsg, 'Destination deleted.')
                this.redirect('/destinations')
            })
            .catch(e => {
                hideLoading();
                showNotification(errMsg, e)
            })
    });
    this.get('/destinations', function(context) {
        showLoading();

        let { uid } = getUserData();
        let mine = [];
        fetch(`https://exam-78599-default-rtdb.europe-west1.firebasedatabase.app/destinations/.json`)
            .then(res => res.json())
            .then(data => {
                Object.keys(data).forEach(of => {
                    if (data[of].from === uid) {
                        data[of].productId = of;
                        mine.push(data[of])
                        console.log(mine[0]);
                    }
                })
                context.mine = mine;
                extendedContext(context)
                    .then(function() {
                        hideLoading();
                        this.partial('/templates/detailsDashboard.hbs')
                    });
            });
    });

    //GET QUERIES -- FINISH
    //POST QUERRIES -- START
    this.post('/edit-offer/:id', function(context) {
        showLoading();

        let { id } = context.params;
        let { uid } = getUserData();
        const { destination, city, duration, departureDate, imgUrl } = context.params;
        let obj = JSON.stringify({
            imgUrl: imgUrl,
            departureDate: departureDate,
            duration: duration,
            from: uid,
            city: city,
            destination: destination
        })
        fetch(`https://exam-78599-default-rtdb.europe-west1.firebasedatabase.app/destinations/${id}.json`, {
                method: 'PATCH',
                body: obj
            })
            .then(res => {
                hideLoading();
                showNotification(goodMsg, 'Successfully edited destination.')
                this.redirect(`/details/${id}`)
            })
            .catch(e => {
                hideLoading();
                showNotification(errMsg, e)
            })
    });


    this.post('/register', function(context) {
        let email = context.params.email;
        let password = context.params.password;
        let repassword = context.params.rePassword;

        let trimmedEmail = email.trim();
        let trimmedPassword = password.trim();
        let trimmedRepassword = repassword.trim();

        let emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

        if (trimmedEmail == '' || trimmedPassword == '' || trimmedRepassword == '') {
            showNotification(errMsg, 'All inputs are required')
            return;
        } else if (!(trimmedEmail.match(emailRegex))) {
            showNotification(errMsg, 'Invalid email!')
        } else if (trimmedPassword != trimmedRepassword) {
            showNotification(errMsg, 'The passwords do not match')
            return;
        } else if (trimmedPassword.lenght < 6) {
            showNotification(errMsg, 'The password should be at least 6 symbols')
            return;
        }

        userModel.createUserWithEmailAndPassword(trimmedEmail, trimmedPassword)
            .then(res => {
                userModel.signInWithEmailAndPassword(trimmedEmail, trimmedPassword)
                    .then(res => {
                        saveUserData(res);
                        showNotification(goodMsg, 'User registration successful.')
                        this.redirect('/home');
                    })
                    .catch(e => {
                        showNotification(errMsg, e)
                    })
            })
            .catch(err => {
                showNotification(errMsg, err)
            })
    });

    this.post('/login', function(context) {
        let email = context.params.email;
        let password = context.params.password;

        let trimmedEmail = email.trim();
        let trimmedPassword = password.trim();

        if (trimmedEmail == '' || trimmedPassword == '') {
            return;
        }

        userModel.signInWithEmailAndPassword(trimmedEmail, trimmedPassword)
            .then(res => {
                showLoading();
                saveUserData(res);
                hideLoading();
                showNotification(goodMsg, 'Login successful.')
                this.redirect('/home');
            })
            .catch(e => {
                showLoading();
                hideLoading();
                showNotification(errMsg, e)
            })

    });

    this.post('/create', function(context) {
        let { destination, city, duration, departureDate, imgUrl } = context.params;
        let trimmedPM = destination.trim();
        let trimmedcity = city.trim();
        let trimmedduration = duration.trim();
        let trimmeddepartureDate = departureDate.trim();
        let trimmedimgUrl = imgUrl.trim();
        if (trimmedPM == '' || trimmedcity == '' || trimmedduration == '' || trimmeddepartureDate == '' || trimmedimgUrl == '') {
            showNotification(errMsg, 'All fields are required!');
            return;
        } else if (typeof destination != "string") {
            showNotification(errMsg, 'Destination should be string!');
            return;
        } else if (typeof city != "string") {
            showNotification(errMsg, 'City should be string!');
            return;
        } else if (typeof destination != "string") {
            showNotification(errMsg, 'Departure date should be string!');
            return;
        } else if (typeof imgUrl != "string") {
            showNotification(errMsg, 'Image url should be string!');
            return;
        } else if (!(Number(duration))) {
            showNotification(errMsg, 'Duration should be number!');
            return;
        } else if (Number(trimmedduration) <= 0 || Number(trimmedduration) >= 100) {
            showNotification(errMsg, 'Duration should be between 1 and 100 days!');
            return;
        }
        let { uid } = getUserData() || undefined;
        if (!uid) {
            return;
        }
        let obj = JSON.stringify({
            destination: trimmedPM,
            city: trimmedcity,
            duration: trimmedduration,
            departureDate: trimmeddepartureDate,
            imgUrl: trimmedimgUrl,
            from: uid,
            clients: {
                uid: 'asd'
            }
        });
        fetch(dbURL, { method: 'POST', body: obj })
            .then(r => {
                showLoading();
                hideLoading();
                this.redirect('/home');
            })
            .catch(e => {
                showLoading();
                hideLoading();
                showNotification(errMsg, e)
            })
    })

    //POST QUERRIES -- FINISH


});
app.run();

function extendedContext(context) {
    const user = getUserData();
    context.isLoggedIn = Boolean(user);
    context.email = user ? user.email : '';
    return context.loadPartials({
        'header': '/templates/header.hbs',
        'footer': '/templates/footer.hbs'
    })
}

function saveUserData(data) {
    const { user: { email, uid } } = data;
    localStorage.setItem('user', JSON.stringify({ email, uid }))
}

function getUserData() {
    let user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function clearUserData() {
    this.localStorage.removeItem('user');
}

function showNotification(box, msg) {
    box.style.display = 'block';
    box.innerHTML = msg;
    setTimeout(() => {
        box.style.display = 'none';
    }, 3000);
}

function showLoading() {
    loading.style.display = 'block';
}

function showLoading() {
    loading.style.display = 'block';
}

function hideLoading() {
    loading.style.display = 'none';
}