import {makeProject} from '@revideo/core';

import './global.css';

import example from './scene';
import videoSplitScene from './videoSplitScene?scene';

export default makeProject({
	name: 'Sprunki Video Splitter',
	scenes: [videoSplitScene],
});
