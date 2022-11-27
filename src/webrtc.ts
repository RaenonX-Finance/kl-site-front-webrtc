type CreateWebRTCPeerOptions = {
  onICEGatherChange?: (state: string) => void,
  onICEConnectionChange?: (state: string) => void,
  onSignalStateChange?: (state: string) => void,
}

export const createWebRTCPeerConnection = ({
  onSignalStateChange,
  onICEConnectionChange,
  onICEGatherChange
}: CreateWebRTCPeerOptions): RTCPeerConnection => {
  const pc = new RTCPeerConnection({
    iceServers: [{urls: ['stun:stun.l.google.com:19302']}],
  });

  // register some listeners to help debugging
  pc.addEventListener('icegatheringstatechange', () => {
    if (onICEGatherChange) {
      onICEGatherChange(pc.iceGatheringState);
    }
  }, false);
  if (onICEGatherChange) {
    onICEGatherChange(pc.iceGatheringState);
  }

  pc.addEventListener('iceconnectionstatechange', () => {
    if (onICEConnectionChange) {
      onICEConnectionChange(pc.iceConnectionState);
    }
  }, false);
  if (onICEConnectionChange) {
    onICEConnectionChange(pc.iceConnectionState);
  }

  pc.addEventListener('signalingstatechange', () => {
    if (onSignalStateChange) {
      onSignalStateChange(pc.signalingState);
    }
  }, false);
  if (onSignalStateChange) {
    onSignalStateChange(pc.signalingState);
  }

  return pc;
}

type NegotiateOpts = {
  peer: RTCPeerConnection,
  offerURL: string,
  onShowOfferSDP?: (sdp: string) => void,
  onShowAnswerSDP?: (sdp: string) => void,
}

export const negotiate = async ({
  peer,
  offerURL,
  onShowOfferSDP,
  onShowAnswerSDP,
}: NegotiateOpts) => {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  await new Promise<void>((resolve) => {
    if (peer.iceGatheringState === 'complete') {
      resolve();
    } else {
      const checkState = () => {
        if (peer.iceGatheringState === 'complete') {
          peer.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      }
      peer.addEventListener('icegatheringstatechange', checkState);
    }
  })

  const localDesc = peer.localDescription;

  if (!localDesc) {
    throw new Error('No local peer description');
  }

  if (onShowOfferSDP) {
    onShowOfferSDP(localDesc.sdp || '(Unavailable)');
  }

  console.log(`Getting answer from ${offerURL}`);

  const answer = await (await fetch(offerURL, {
    body: JSON.stringify({
      sdp: localDesc.sdp,
      type: localDesc.type,
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST'
  })).json();

  if (onShowAnswerSDP) {
    onShowAnswerSDP(answer.sdp);
  }

  await peer.setRemoteDescription(answer);
}

type StartOpts = CreateWebRTCPeerOptions & Omit<NegotiateOpts, 'peer'> & {
  onClose?: (dataCh: RTCDataChannel) => () => void,
  onOpen?: (dataCh: RTCDataChannel) => () => void,
  onMessage: (e: MessageEvent) => void,
};

export const startRTC = async (opts: StartOpts) => {
  const {onClose, onOpen, onMessage} = opts;

  const peer = createWebRTCPeerConnection(opts);

  const dataChannel = peer.createDataChannel('marketPx', {ordered: true});
  if (onClose) {
    dataChannel.onclose = onClose(dataChannel);
  }
  if (onOpen) {
    dataChannel.onopen = onOpen(dataChannel);
  }
  dataChannel.onmessage = onMessage;

  await negotiate({peer, ...opts});
}
