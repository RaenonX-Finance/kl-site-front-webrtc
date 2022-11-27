import React from 'react';
import './App.css';
import {startRTC} from './webrtc';

type State = {
  currentNQ: number | null,
  lastUpdatedEpoch: number[],
  iceGather: string | null,
  iceConnection: string | null,
  signal: string | null,
  offerSDP: string | null,
  answerSDP: string | null,
};

const App = () => {
  const [state, setState] = React.useState<State>({
    currentNQ: null,
    lastUpdatedEpoch: [],
    iceGather: null,
    iceConnection: null,
    signal: null,
    offerSDP: null,
    answerSDP: null,
  });
  const {currentNQ, lastUpdatedEpoch, iceGather, iceConnection, signal, offerSDP, answerSDP} = state;

  React.useEffect(() => {
    startRTC({
      offerURL: 'http://localhost:8182/offer',
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
    });
  }, []);

  return (
    <>
      <div>
        <p>Current NQ: <span className="market-px">{currentNQ || '(Unavailable)'}</span></p>
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
      <div style={{maxHeight: '5rem'}}>{offerSDP}</div>
      <h4>Answer SDP</h4>
      <div style={{maxHeight: '5rem'}}>{answerSDP}</div>
    </>
  );
}

export default App;
