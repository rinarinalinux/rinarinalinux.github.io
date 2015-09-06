var request = window.superagent;
var API_HOST = window.PC.API_HOST || '//picasa-connect.ik.am';
var USER_ID = window.PC.USER_ID;
var PAGE_SIZE = window.PC.PAGE_SIZE || 96;
var Modal = window.ReactModal;
var appElement = window.PC.APP_ELEMENT || document.getElementById('gallery');
var Fluxxor = window.Fluxxor;

Modal.setAppElement(appElement);
Modal.injectCSS();


// Client
var PhotosClient = {
    get: function (url) {
        url = url || API_HOST + '/api/users/' + USER_ID + '/photos';
        return request.get(url);
    }
};
var GenresClient = {
    get: function () {
        return request.get(API_HOST + '/api/users/' + USER_ID + '/genres');
    }
};

var constants = {
    LOAD_PHOTOS: 'LOAD_PHOTOS',
    CHANGE_GENRE: 'CHANGE_GENRE'
};

// Store
var PhotosStore = Fluxxor.createStore({
    initialize: function () {
        this.page = 0;
        this.size = PAGE_SIZE;
        this.photos = {
            content: [],
            first: true,
            last: true,
            number: this.page,
            size: 10,
            totalPages: 1
        };
        this.loading = true;

        this.bindActions(constants.LOAD_PHOTOS, this.onLoadPhotos);
        this.bindActions(constants.CHANGE_GENRE, this.onLoadPhotos);
    },
    onLoadPhotos: function (payload) {
        this.loading = true;
        this.genre = payload.genre;
        this.emit('change');

        PhotosClient.get(payload.link)
            .query({
                page: this.page,
                size: this.size
            })
            .end(function (err, res) {
                this.photos = res.body;
                this.loading = false;
                this.emit('change');
            }.bind(this));
    },
    getState: function () {
        return {
            genre: this.genre,
            photos: this.photos,
            loading: this.loading
        };
    }
});

// Action
var actions = {
    loadPhotos: function (link) {
        this.dispatch(constants.LOAD_PHOTOS, {
            link: link
        });
    },
    changeGenre: function (link, genre) {
        this.dispatch(constants.CHANGE_GENRE, {
            link: link,
            genre: genre
        });
    }
};

// View
var FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;

var Gallery = React.createClass({
    mixins: [FluxMixin],
    render: function () {
        return (
            <div>
                <Photos />
                <Genres />
            </div>);
    }
});

var Photos = React.createClass({
    mixins: [FluxMixin, StoreWatchMixin('PhotosStore')],
    getStateFromFlux: function () {
        return this.getFlux()
            .store('PhotosStore')
            .getState();
    },
    componentDidMount: function () {
        this.getFlux().actions.loadPhotos();
    },
    render: function () {
        var info = [];
        for (var i = 0, len = this.state.photos.content.length; i < len; i++) {
            info[i] = this.state.photos.content[i];
            if (i == len - 1) {
                info[i]._next = 0;
            } else {
                info[i]._next = i + 1;
            }
            if (i == 0) {
                info[i]._prev = len - 1;
            } else {
                info[i]._prev = i - 1;
            }
        }

        var photos = info.map(function (x) {
            return (<Photo data={x}/>);
        });
        photos.forEach(function (p) {
            p.props.photos = photos; // bad hack
        });
        if (photos.length == 0) {
            photos = this.state.loading ? (<p>Loading...</p>) : (<p>Empty...</p>);
        }
        return (
            <div>
                <h3>Photos</h3>
                <h4>{this.state.genre}</h4>
                {photos}
            </div>);
    }
});

var Photo = React.createClass({
    getInitialState: function () {
        this.props.instance = this; // bad hack
        return {modalIsOpen: false};
    },
    openModal: function () {
        this.setState({modalIsOpen: true});
    },

    closeModal: function () {
        this.setState({modalIsOpen: false});
    },
    showNext: function () {
        var next = this.props.photos[this.props.data._next];
        this.closeModal();
        next.props.instance.openModal();
    },
    showPrev: function () {
        var prev = this.props.photos[this.props.data._prev];
        this.closeModal();
        prev.props.instance.openModal();
    },
    render: function () {
        return (<span>
            <img className="cut" src={this.props.data.smallThumbnail} onClick={this.openModal}/>
            <Modal isOpen={this.state.modalIsOpen} onRequestClose={this.closeModal}>
                <h2>{this.props.data.title}</h2>
                <button onClick={this.showPrev}>&lt; Prev</button>
                <button onClick={this.showNext}>Next &gt;</button>
                <button onClick={this.closeModal}>Close</button>
                <table>
                    <tr>
                        <td>
                            <img src={this.props.data.largeThumbnail}/>
                        </td>
                        <td>
                            <dl>
                                <dt>Genre</dt>
                                <dd>{this.props.data.genre.genreName}</dd>
                                <dt>Comment</dt>
                                <dd>{this.props.data.comment}</dd>
                                <dt>Shooting Date</dt>
                                <dd>{new Date(this.props.data.published).getFullYear() + '/' + (new Date(this.props.data.published).getMonth() + 1)}</dd>
                            </dl>
                        </td>
                    </tr>
                </table>
            </Modal>
            </span>);
    }
});

var Genres = React.createClass({
    getInitialState: function () {
        return {content: [], _links: []};
    },
    componentDidMount: function () {
        GenresClient.get()
            .end(function (err, res) {
                this.setState(res.body);
            }.bind(this));
    },
    render: function () {
        var genres = this.state._links.map(function (x) {
            return (<Genre data={x}/>);
        }.bind(this));
        return (
            <div className="clear">
                <h3>Genres</h3>
                <ul>
                    {genres}
                </ul>
            </div>);
    }
});

var Genre = React.createClass({
    mixins: [FluxMixin],
    onClick: function () {
        var href = this.props.data.href;
        if (location.protocol === 'https:') {
            href = href.replace('http:', 'https:');
        }
        this.getFlux().actions.changeGenre(href, this.props.data.rel);
    },
    render: function () {
        return (<li><a href="#" onClick={this.onClick}>{this.props.data.rel}</a></li>);
    }
});

var stores = {PhotosStore: new PhotosStore()};
var flux = new Fluxxor.Flux(stores, actions);
React.render(<Gallery flux={flux}/>, appElement);

