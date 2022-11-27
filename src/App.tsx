import React from 'react';
import './App.css';
import {startRTC} from './webrtc';

type State = {
  currentPx: Record<string, number>,
  lastUpdatedEpoch: number[],
  iceGather: string | null,
  iceConnection: string | null,
  signal: string | null,
  offerSDP: string | null,
  answerSDP: string | null,
};

const App = () => {
  const [state, setState] = React.useState<State>({
    currentPx: {},
    lastUpdatedEpoch: [],
    iceGather: null,
    iceConnection: null,
    signal: null,
    offerSDP: null,
    answerSDP: null,
  });
  const {currentPx, lastUpdatedEpoch, iceGather, iceConnection, signal, offerSDP, answerSDP} = state;

  React.useEffect(() => {
    startRTC({
      offerURL: process.env.REACT_APP_OFFER_PATH || 'http://localhost:8182/offer',
      onMessage: (e: MessageEvent) => setState((state) => ({
        ...state,
        currentNQ: e.data,
        lastUpdatedEpoch: [...state.lastUpdatedEpoch, Date.now() / 1000].slice(-10),
      })),
      onICEGatherChange: (newVal) => setState((state) => ({...state, iceGather: newVal})),
      onICEConnectionChange: (newVal) => setState((state) => ({...state, iceConnection: newVal})),
      onSignalStateChange: (newVal) => setState((state) => ({...state, signal: newVal})),
      onShowOfferSDP: (newVal) => setState((state) => ({...state, offerSDP: newVal})),
      onShowAnswerSDP: (newVal) => setState((state) => ({...state, answerSDP: newVal})),
    }).catch(alert);
  }, []);

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
        <ul>
          {lastUpdatedEpoch.reverse().map((lastUpdated) => (
            <li key={lastUpdated}>{new Date(lastUpdated).toString()}</li>
          ))}
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
      <div>{offerSDP}</div>
      <h4>Answer SDP</h4>
      <div>{answerSDP}</div>
    </>
  );
}

export default App;
