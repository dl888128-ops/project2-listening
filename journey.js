(() => {
  const steps = ['pre', 'top', 'bottom', 'infer', 'tlf', 'post'];
  const extras = ['material', 'self', 'sources'];
  const sections = [...steps, ...extras].map(id => document.getElementById(id));
  const progressWrap = document.querySelector('.progress-wrap');
  const controls = document.createElement('div');
  controls.className = 'journey-controls';
  controls.hidden = true;
  controls.innerHTML = '<a class="btn secondary" id="journey-back" href="#home">← Back</a><a class="btn" id="journey-next" href="#top">Next →</a>';
  document.querySelector('footer').before(controls);
  const gateStatus = document.createElement('p');
  gateStatus.className = 'lesson-gate-status small';
  gateStatus.setAttribute('role','status');
  gateStatus.setAttribute('aria-live','polite');
  controls.append(gateStatus);
  const report = document.createElement('section');
  report.id = 'lesson-results';
  report.className = 'card';
  report.hidden = true;
  report.innerHTML = '<h2>Your learning results</h2><div id="lesson-results-body"></div><p class="small muted">First-attempt accuracy measures your initial submitted answers, not the final number correct after retries. Written work is self-reviewed, not automatically graded.</p><button class="btn secondary" id="results-back" type="button">Return to lesson</button>';
  controls.after(report);
  report.querySelector('#results-back').addEventListener('click',()=>{report.hidden=true;location.hash='#post';});
  let maxUnlocked = 0;
  let campaignReviewed = false;
  const completeStage = (id) => {
    if(id==='pre') return Boolean(document.querySelector('input[name="prediction"]:checked')) && Boolean(document.getElementById('pretext').value.trim());
    if(id==='post') return campaignReviewed && Boolean(document.getElementById('campaign').value.trim());
    const section = document.getElementById(id);
    const questions = [...section.querySelectorAll('.q[data-answer][data-scope="core"]')];
    const correct = questions.every(q=>window.results?.[q.querySelector('input[type="radio"]').name]===true);
    if(id==='tlf') return correct && document.getElementById('question-q21').dataset.reviewed==='true';
    return correct;
  };
  function refreshGate(){
    const id=location.hash.slice(1), index=steps.indexOf(id);
    const next=document.getElementById('journey-next');
    if(index<0){gateStatus.textContent='';next.removeAttribute('aria-disabled');return;}
    const done=completeStage(id);
    next.setAttribute('aria-disabled',String(!done));
    next.classList.toggle('lesson-locked',!done);
    gateStatus.textContent=done?'Stage complete. You can continue.': id==='pre'?'Choose a prediction and write your response to continue.':id==='post'?'Write your campaign and open its self-review to finish.':'Answer all required questions correctly to unlock Next. You can retry with feedback.';
    if(done)maxUnlocked=Math.max(maxUnlocked,index+1);
  }
  window.refreshLessonGate=refreshGate;
  controls.addEventListener('click',event=>{
    const next=event.target.closest('#journey-next');
    if(!next)return;
    const id=location.hash.slice(1);
    if(!completeStage(id)){event.preventDefault();refreshGate();return;}
    if(id==='post'){
      event.preventDefault();
      const core=[...document.querySelectorAll('.q[data-scope="core"][data-answer]')];
      const first=core.filter(q=>window.firstAttemptCorrect?.[q.querySelector('input[type="radio"]').name]===true).length;
      const wrong=core.reduce((sum,q)=>sum+(window.incorrectAttempts?.[q.querySelector('input[type="radio"]').name]||0),0);
      document.getElementById('lesson-results-body').innerHTML='<p><strong>Core listening & language questions:</strong> '+core.length+' / '+core.length+' eventually correct</p><p><strong>First-attempt accuracy:</strong> '+first+' / '+core.length+' ('+Math.round(100*first/core.length)+'%)</p><p><strong>Incorrect submissions before completion:</strong> '+wrong+'</p><p><strong>Written advice:</strong> Self-review completed</p><p><strong>Campaign:</strong> Draft submitted for self-review</p>';
      report.hidden=false;
      report.scrollIntoView({block:'start'});
    }
  });
  document.querySelectorAll('.journey-nav a').forEach(a=>a.addEventListener('click',event=>{
    const target=steps.indexOf(a.hash.slice(1));
    if(target>maxUnlocked){event.preventDefault();refreshGate();gateStatus.textContent='Complete the earlier stages before opening this stage.';}
  }));
  document.getElementById('submit-campaign').addEventListener('click',()=>{
    campaignReviewed=Boolean(document.getElementById('campaign').value.trim());refreshGate();
  });
  document.getElementById('campaign').addEventListener('input',()=>{campaignReviewed=false;refreshGate();});
  document.getElementById('pretext').addEventListener('input',refreshGate);
  document.querySelectorAll('input[name="prediction"]').forEach(el=>el.addEventListener('change',refreshGate));
  document.getElementById('complete-advice-review').addEventListener('click',refreshGate);
  document.getElementById('expression-sentence').addEventListener('input',refreshGate);

  const extraNav = document.createElement('nav');
  extraNav.setAttribute('aria-label', 'Lesson resources');
  extraNav.innerHTML = '<a href="#material">Listening material</a><a href="#self">Self-study & reflection</a><a href="#sources">Source & teacher notes</a>';
  document.querySelector('footer').before(extraNav);
  function render(focus) {
    document.getElementById('return-question').hidden = true;
    document.getElementById('replay-focus').textContent = '';
    const id = location.hash.slice(1);
    const requestedIndex=steps.indexOf(id);
    if(requestedIndex>maxUnlocked){location.hash='#'+steps[maxUnlocked];return;}
    const index = steps.indexOf(id);
    const active = [...steps, ...extras].includes(id);
    sections.forEach(section => { section.hidden = active ? section.id !== id : true; });
    const player = document.getElementById('pbs-player');
    const frame = player.querySelector('iframe');
    player.hidden = !active;
    // Unload the real player on the landing page so hidden audio cannot continue.
    if (!active) frame.removeAttribute('src');
    else if (!frame.hasAttribute('src')) frame.src = 'https://player.pbs.org/viralplayer/3085131073/';
    progressWrap.hidden = index < 0;
    document.getElementById('core-tracking').hidden = index < 0;
    controls.hidden = !active;
    document.querySelectorAll('.journey-nav a').forEach(link => {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    if (index >= 0) {
      document.getElementById('progress-label').textContent = `Step ${index + 1} of 6 · ${index === 5 ? 'Your Turn' : 'Keep listening, keep thinking'}`;
      document.getElementById('journey-progress').value = index + 1;
    }
    const back = document.getElementById('journey-back');
    const next = document.getElementById('journey-next');
    back.href = index > 0 ? '#' + steps[index - 1] : '#home';
    back.textContent = index > 0 ? '← Back' : '← Back to start';
    next.href = index >= 0 && index < 5 ? '#' + steps[index + 1] : id === 'post' ? '#home' : '#pre';
    next.textContent = id === 'post' ? 'Finish core lesson →' : index >= 0 ? 'Next →' : 'Go to lesson →';
    refreshGate();
    if (active && focus) {
      const heading = document.querySelector('#' + id + ' h2');
      heading.tabIndex = -1;
      heading.classList.add('lesson-heading');
      heading.focus({ preventScroll: true });
      document.getElementById('lesson').scrollIntoView({ block: 'start' });
    } else if (!active && focus) {
      const heading = document.querySelector('#home h1');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: 'start' });
    }
  }
  window.addEventListener('hashchange', () => render(true));
  render(Boolean(location.hash && location.hash !== '#home'));
  // Count attempts only on explicit Check answer submissions, not option changes.
  // Associate every writing prompt with its existing response field.
  const labels = {pretext: 'What information would help teenagers decide how to use social media responsibly?', campaign: 'Your digital well-being campaign, 80–120 words', reflection: 'Which listening strategy helped you most? Explain why.'};
  Object.entries(labels).forEach(([id, label]) => document.getElementById(id).setAttribute('aria-label', label));
})();

// Replay is manual: these controls only move focus, never send seek commands.
let replayOrigin = null;
const returnQuestion = document.getElementById('return-question');
returnQuestion.addEventListener('click', () => {
  if (replayOrigin && !replayOrigin.closest('section').hidden) {
    replayOrigin.focus({ preventScroll: true });
    replayOrigin.closest('.q').scrollIntoView({ block: 'start' });
    returnQuestion.hidden = true;
  }
});
document.querySelectorAll('[data-listen]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', event => {
    event.preventDefault();
    replayOrigin = button;
    returnQuestion.hidden = false;
    const heading = document.getElementById('player-title');
    const focus = button.closest('.q')?.querySelector('.listening-purpose');
    document.getElementById('replay-focus').textContent = (focus ? focus.textContent : 'Replay the passage described in the activity.') + ' Use the PBS timeline to find this passage manually, then choose Return to my question. Playback does not start automatically.';
    heading.focus({ preventScroll: true });
    document.querySelector('#pbs-player .pbs-embed').scrollIntoView({ block: 'start' });
  });
});
const campaignReview = document.getElementById('campaign-review');
campaignReview.hidden = true;
document.getElementById('submit-campaign').addEventListener('click', () => {
  const field = document.getElementById('campaign');
  const text = field.value.trim();
  const status = document.getElementById('campaign-status');
  if (!text) {
    status.textContent = 'Write your campaign message before opening the self-review.';
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', 'campaign-status');
    field.focus();
    return;
  }
  field.removeAttribute('aria-invalid');
  const words = text.split(/\s+/).length;
  status.textContent = `Draft opened for self-review · ${words} words. ` +
    (words < 80 || words > 120 ? 'Aim for 80–120 words as you revise. ' : '') +
    'Use the checklist and example below; no automatic writing evaluation is performed.';
  campaignReview.hidden = false;
});
document.getElementById('campaign').addEventListener('input', event => {
  event.target.removeAttribute('aria-invalid');
});
document.getElementById('review-expression').addEventListener('click', () => {
  const field = document.getElementById('expression-sentence');
  const status = document.getElementById('expression-status');
  const review = document.getElementById('expression-review');
  if (!field.value.trim()) {
    status.textContent = 'Write your advice first, then use the self-review prompt.';
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', 'expression-status');
    review.hidden = true;
    field.focus();
    return;
  }
  field.removeAttribute('aria-invalid');
  status.textContent = 'Review your recommended action, advice structure, and reason using the prompt below.';
  review.hidden = false;
});

// Give each radio group a programmatic question label as well as visible labels.
document.querySelectorAll('.q').forEach(group => {
  const input = group.querySelector('input[type="radio"]');
  const prompt = group.querySelector('.question-title') ||
    [...group.querySelectorAll('p')].find(p => !p.classList.contains('listening-purpose'));
  if (input && prompt) {
    prompt.id = 'prompt-' + input.name;
    group.setAttribute('role', 'group');
    group.setAttribute('aria-labelledby', prompt.id);
  }
});

// Written completion records the learner's self-review, never a writing grade.
const adviceGroup = document.getElementById('question-q21');
const adviceChecks = [...document.querySelectorAll('[data-advice-check]')];
document.getElementById('complete-advice-review').addEventListener('click', () => {
  const field = document.getElementById('expression-sentence');
  const status = document.getElementById('expression-status');
  if (!field.value.trim() || !adviceChecks.every(input => input.checked)) {
    status.textContent = 'Write your recommendation and review all three checklist items before marking self-review complete.';
    return;
  }
  adviceGroup.dataset.reviewed = 'true';
  status.textContent = 'Self-review marked complete. This records your review, not an automatic assessment of writing quality.';
  updateLearningProgress();
  window.refreshLessonGate?.();
});
document.getElementById('expression-sentence').addEventListener('input', () => {
  adviceGroup.dataset.reviewed = 'false';
  adviceChecks.forEach(input => input.checked = false);
  document.getElementById('expression-status').textContent = 'Draft updated. Review the checklist again when you are ready.';
  updateLearningProgress();
});
adviceChecks.forEach(input => input.addEventListener('change', () => {
  if (!adviceChecks.every(item => item.checked)) adviceGroup.dataset.reviewed = 'false';
  updateLearningProgress();
}));
updateLearningProgress();

// Brief language practice supports application without changing core completion.
const effectsFields = ['effect-sleep', 'effect-support'].map(id => document.getElementById(id));
const effectsFeedback = document.getElementById('effects-feedback');
document.getElementById('check-effects').addEventListener('click', () => {
  const [sleep, support] = effectsFields.map(field => field.value);
  if (!sleep || !support) {
    effectsFeedback.textContent = 'Choose an adjective for both situations, then check again.';
    return;
  }
  const messages = [];
  messages.push(sleep === 'detrimental'
    ? 'Yes: detrimental to Min’s sleep fits the late night and tiredness.'
    : 'Revisit Min’s tiredness after scrolling: does that suggest a helpful or harmful effect on sleep?');
  messages.push(support === 'beneficial'
    ? 'Yes: beneficial to Jiyun’s learning fits the help from classmates.'
    : 'Revisit what Jiyun gains from the chat: does the homework support help or harm learning?');
  effectsFeedback.textContent = messages.join(' ') + ' After to, name the person or thing affected.';
});
effectsFields.forEach(field => field.addEventListener('change', () => { effectsFeedback.textContent = ''; }));
const adviceChoice = document.getElementById('advice-choice');
const adviceFeedback = document.getElementById('advice-feedback');
document.getElementById('check-advice').addEventListener('click', () => {
  const messages = {
    '': 'Choose a recommendation, then check how its language and action fit the problem.',
    form: 'The reason fits, but consider takes an -ing form. Revise the verb after consider, then try again.',
    fit: 'Should + base verb is grammatical here, but checking every alert adds interruptions. Choose an action that supports the classmate’s goal.',
    helpful: 'Yes! Consider + silencing offers an option, and the because clause explains how fewer interruptions could help with homework.'
  };
  adviceFeedback.textContent = messages[adviceChoice.value];
});
adviceChoice.addEventListener('change', () => { adviceFeedback.textContent = ''; });
