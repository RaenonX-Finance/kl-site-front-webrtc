import React from 'react';
import './App.css';
import {startRTC} from './webrtc';

type UpdateInfo = {
  epoch: number,
  data: string,
}

type State = {
  currentPx: Record<string, number>,
  lastUpdatedInfo: UpdateInfo[],
  iceGather: string | null,
  iceConnection: string | null,
  signal: string | null,
  offerSDP: string | null,
  answerSDP: string | null,
};

const LAST_UPDATE_COUNT = 150;

const App = () => {
  const [state, setState] = React.useState<State>({
    currentPx: {},
    lastUpdatedInfo: [],
    iceGather: null,
    iceConnection: null,
    signal: null,
    offerSDP: null,
    answerSDP: null,
  });
  const {currentPx, lastUpdatedInfo, iceGather, iceConnection, signal, offerSDP, answerSDP} = state;

  React.useEffect(() => {
    startRTC({
      offerURL: process.env.REACT_APP_OFFER_PATH || 'http://localhost:8182/offer',
      onMessage: (e: MessageEvent) => setState((state) => {
        const [security, px] = e.data.split(' ', 2);

        return {
          ...state,
          currentPx: {...state.currentPx, [security]: px},
          lastUpdatedInfo: [...state.lastUpdatedInfo, {epoch: Date.now(), data: e.data}].slice(-LAST_UPDATE_COUNT - 1),
        }
      }),
      onICEGatherChange: (newVal) => setState((state) => ({...state, iceGather: newVal})),
      onICEConnectionChange: (newVal) => setState((state) => ({...state, iceConnection: newVal})),
      onSignalStateChange: (newVal) => setState((state) => ({...state, signal: newVal})),
      onShowOfferSDP: (newVal) => setState((state) => ({...state, offerSDP: newVal})),
      onShowAnswerSDP: (newVal) => setState((state) => ({...state, answerSDP: newVal})),
    }).catch(alert);
  }, []);

  const revInfo = lastUpdatedInfo.slice().reverse();

  document.title = Object
    .entries(currentPx)
    .map(([security, px]) => `${security} ${px}`)
    .join(' ');

  return (
    <>
      <div>
        {
          Object.keys(currentPx).length ?
            Object.entries(currentPx).map(([security, px]) => (
              <p>Current {security}: <span className="market-px">{px}</span></p>
            )) :
            '(No px data available)'
        }
        <p>Last updated:</p>
        <ul className="last-update">
          {revInfo.map(({epoch, data}, idx) => {
            if (idx >= LAST_UPDATE_COUNT) {
              return <></>;
            }

            const prev = revInfo[idx + 1];
            const diff = prev && (epoch - prev.epoch) / 1000;

            return (
              <li key={`${epoch}${data}`}>
                {new Date(epoch).toISOString()}&nbsp;{diff && `(${diff.toFixed(3)})`}&nbsp;-&nbsp;{data}
              </li>
            );
          })}
        </ul>
      </div>
      <hr/>
      <div>
        <p>ICE Gather: {iceGather}</p>
        <p>ICE Connection: {iceConnection}</p>
        <p>Signal: {signal}</p>
      </div>
      <hr/>
      <h4>Offer SDP</h4>
      <pre>{offerSDP}</pre>
      <h4>Answer SDP</h4>
      <pre>{answerSDP}</pre>
    </>
  );
}

export default App;
