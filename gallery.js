var request = window.superagent;
var API_HOST = 'http://picasa-connect.cfapps.io';
var USER_ID = '105738321969161413623';
var Modal = window.ReactModal;
var appElement = document.getElementById('gallery');

Modal.setAppElement(appElement);
Modal.injectCSS();

var PhotosModel = {
    get: function (url) {
        url = url || API_HOST + '/api/users/' + USER_ID + '/photos';
        return request.get(url);
    }
};
var GenresModel = {
    get: function () {
        return request.get(API_HOST + '/api/users/' + USER_ID + '/genres');
    }
};

var Gallery = React.createClass({
    getInitialState: function () {
        return {url: null};
    },
    setUrl: function (url) {
        this.setState({url: url});
    },
    render: function () {
        return (
            <div>
                <Photos url={this.state.url}/>
                <Genres onGenreChange={this.setUrl}/>
            </div>);
    }
});

var Photos = React.createClass({
    getInitialState: function () {
        return {
            content: [],
            first: true,
            last: true,
            number: 0,
            size: 10,
            totalPages: 1
        };
    },
    loadFromServer: function (url) {
        PhotosModel.get(url)
            .query({size: 96})
            .end(function (err, res) {
                var state = res.body;
                state.currentUrl = url;
                this.setState(state);
            }.bind(this));
    },
    componentDidMount: function () {
        this.loadFromServer();
    },
    render: function () {
        if (this.props.url && this.props.url !== this.state.currentUrl) {
            this.loadFromServer(this.props.url);
        }
        var photos = this.state.content.map(function (x) {
            return (<Photo data={x}/>);
        });
        return (
            <div>
                <h3>Photos</h3>
                {photos}
            </div>);
    }
});

var Photo = React.createClass({
    getInitialState: function () {
        return {modalIsOpen: false};
    },
    openModal: function () {
        this.setState({modalIsOpen: true});
    },

    closeModal: function () {
        this.setState({modalIsOpen: false});
    },
    render: function () {
        return (<span>
            <img className="cut" src={this.props.data.smallThumbnail} onClick={this.openModal}/>
            <Modal isOpen={this.state.modalIsOpen} onRequestClose={this.closeModal}>
                <h2>{this.props.data.title}</h2>
                <button onClick={this.closeModal}>close</button>
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
        GenresModel.get()
            .end(function (err, res) {
                this.setState(res.body);
            }.bind(this));
    },
    render: function () {
        var links = {};
        for (var i = 0; i < this.state._links.length; i++) {
            var l = this.state._links[i];
            links[l.rel] = l.href;
        }
        var genres = this.state.content.map(function (x) {
            return (<Genre data={x}
                           link={links[x.genreName]}
                           onGenreChange={this.props.onGenreChange}/>);
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
    onClick: function () {
        this.props.onGenreChange(this.props.link);
    },
    render: function () {
        return (<li><a href="#" onClick={this.onClick}>{this.props.data.genreName}</a></li>);
    }
});


React.render(<Gallery />, appElement);

