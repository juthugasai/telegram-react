/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DownloadIcon from '../../../Assets/Icons/Download';
import PlayArrowIcon from '../../../Assets/Icons/PlayArrow';
import PauseIcon from '../../../Assets/Icons/Pause';
import DocumentTile from '../../Tile/DocumentTile';
import AudioAction from './AudioAction';
import VoiceNoteSlider from './VoiceNoteSlider';
import { getAudioShortTitle, getAudioSubtitle } from '../../../Utils/Media';
import { supportsStreaming } from '../../../Utils/File';
import PlayerStore from '../../../Stores/PlayerStore';
import './Audio.css';
import { isCurrentSource } from '../../../Utils/Player';

class Audio extends React.Component {
    constructor(props) {
        super(props);

        const { chatId, messageId } = props;

        const { message, playing } = PlayerStore;
        const active = message && message.chat_id === chatId && message.id === messageId;

        this.state = {
            active,
            playing: active ? playing : false
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { active, playing } = this.state;

        if (nextState.active !== active) {
            return true;
        }

        if (nextState.playing !== playing) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaPlay', this.onClientUpdateMediaPlay);
        PlayerStore.on('clientUpdateMediaPause', this.onClientUpdateMediaPause);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.off('clientUpdateMediaPlay', this.onClientUpdateMediaPlay);
        PlayerStore.off('clientUpdateMediaPause', this.onClientUpdateMediaPause);
        PlayerStore.off('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId, block } = this.props;
        const { source } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        this.setState({
            active: false,
            playing: false
        });
    };

    onClientUpdateMediaPlay = update => {
        const { chatId, messageId, block } = this.props;
        const { source } = update;

        this.setState({ playing: isCurrentSource(chatId, messageId, block, source) });
    };

    onClientUpdateMediaPause = update => {
        const { chatId, messageId, block } = this.props;
        const { source } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        this.setState({ playing: false });
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId, block } = this.props;

        if (chatId && messageId && chatId === update.chatId && messageId === update.messageId || block === update.block) {
            if (!this.state.active) {
                this.setState({
                    active: true,
                    playing: true
                });
            }
        } else if (this.state.active) {
            this.setState({
                active: false,
                playing: false
            });
        }
    };

    render() {
        const { chatId, messageId, block, audio, openMedia, title, meta, caption } = this.props;
        const { playing, active } = this.state;
        if (!audio) return null;

        const { album_cover_thumbnail, duration, audio: file } = audio;

        const audioTitle = getAudioSubtitle(audio);
        const audioSubtitle = getAudioShortTitle(audio);
        const completeIcon = playing ? <PauseIcon /> : <PlayArrowIcon />;

        return (
            <div className={classNames('audio', 'document', { 'media-title': title })}>
                <DocumentTile
                    thumbnail={album_cover_thumbnail}
                    file={file}
                    openMedia={openMedia}
                    streaming={supportsStreaming()}
                    icon={supportsStreaming() ? completeIcon : <DownloadIcon />}
                    completeIcon={completeIcon}
                />
                <div className='audio-content'>
                    <div className='document-title'>
                        <a className='document-name' onClick={openMedia} title={audioTitle}>
                            {audioTitle}
                        </a>
                    </div>
                    <div className='audio-action' style={{ opacity: active ? 0 : 1 }}>{audioSubtitle}</div>
                    <VoiceNoteSlider audio className='audio-slider' chatId={chatId} messageId={messageId} block={block} duration={duration} style={{ opacity: active ? 1 : 0 }}/>
                    <AudioAction
                        chatId={chatId}
                        messageId={messageId}
                        block={block}
                        duration={duration}
                        file={file}
                        meta={caption ? null : meta}
                        streaming={supportsStreaming()}
                    />
                </div>
            </div>
        );
    }
}

Audio.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    block: PropTypes.object,
    audio: PropTypes.object,
    openMedia: PropTypes.func
};

export default Audio;
