// British Monarchs — English Kings/Queens from 1066 to Declaration of Independence
// Reign dates for timeline positioning
// Portrait images expected in: app-timeline/images/

const MONARCHS = [
  // Norman dynasty
  { id:'williamI',   name:'William I',   reignStart:1066, reignEnd:1087,  img:'/images/williamI-portrait.jpg' },
  { id:'williamII',  name:'William II',  reignStart:1087, reignEnd:1100,  img:'/images/williamII-portrait.jpg' },
  { id:'henryI',     name:'Henry I',     reignStart:1100, reignEnd:1135,  img:'/images/henryI-portrait.jpg' },
  // The Anarchy
  { id:'matilda',    name:'Matilda',     reignStart:1141, reignEnd:1141,  img:'/images/matilda-portrait.png' },
  { id:'stephen',    name:'Stephen',     reignStart:1135, reignEnd:1154,  img:'/images/stephen-portrait.jpg' },
  // Plantagenet
  { id:'henryII',    name:'Henry II',    reignStart:1154, reignEnd:1189,  img:'/images/henryII-portrait.jpg' },
  { id:'richardI',   name:'Richard I',   reignStart:1189, reignEnd:1199,  img:'/images/richardI-portrait.jpg' },
  { id:'john',       name:'John',        reignStart:1199, reignEnd:1216,  img:'/images/john-portrait.jpg' },
  { id:'louisVIII',  name:'Louis VIII',  reignStart:1216, reignEnd:1216,  img:'/images/louisVIII-portrait.jpg' },
  { id:'henryIII',   name:'Henry III',   reignStart:1216, reignEnd:1272,  img:'/images/henryIII-portrait.jpg' },
  { id:'edwardI',    name:'Edward I',    reignStart:1272, reignEnd:1307,  img:'/images/edwardI-portrait.jpg' },
  { id:'edwardII',   name:'Edward II',   reignStart:1307, reignEnd:1327,  img:'/images/edwardII-portrait.jpg' },
  { id:'edwardIII',  name:'Edward III',  reignStart:1327, reignEnd:1377,  img:'/images/edwardIII-portrait.jpg' },
  { id:'richardII',  name:'Richard II',  reignStart:1377, reignEnd:1399,  img:'/images/richardII-portrait.jpg' },
  // Lancaster
  { id:'henryIV',    name:'Henry IV',    reignStart:1399, reignEnd:1413,  img:'/images/henryIV-portrait.jpg' },
  { id:'henryV',     name:'Henry V',     reignStart:1413, reignEnd:1422,  img:'/images/henryV-portrait.jpg' },
  { id:'henryVI',    name:'Henry VI',    reignStart:1422, reignEnd:1461,  img:'/images/henryVI-portrait.jpg' },
  // York
  { id:'edwardIV',   name:'Edward IV',   reignStart:1461, reignEnd:1483,  img:'/images/edwardIV-portrait.png' },
  { id:'edwardV',    name:'Edward V',    reignStart:1483, reignEnd:1483,  img:'/images/edwardV-portrait.jpg' },
  { id:'richardIII', name:'Richard III', reignStart:1483, reignEnd:1485,  img:'/images/richardIII-portrait.jpg' },
  // Tudor
  { id:'henryVII',   name:'Henry VII',   reignStart:1485, reignEnd:1509,  img:'/images/henryVII-portrait.jpg' },
  { id:'henryVIII',  name:'Henry VIII',  reignStart:1509, reignEnd:1547,  img:'/images/henryVIII-portrait.jpg' },
  { id:'edwardVI',   name:'Edward VI',   reignStart:1547, reignEnd:1553,  img:'/images/edwardVI-portrait.jpg' },
  { id:'jane',       name:'Jane',        reignStart:1553, reignEnd:1553,  img:'/images/jane-portrait.jpg' },
  { id:'maryI',      name:'Mary I',      reignStart:1553, reignEnd:1558,  img:'/images/maryI-portrait.jpg' },
  { id:'philip',     name:'Philip',      reignStart:1554, reignEnd:1558,  img:'/images/philip-portrait.jpg' },
  { id:'elizabethI', name:'Elizabeth I', reignStart:1558, reignEnd:1603,  img:'/images/elizabethI-portrait.jpg' },
  // Stuart
  { id:'jamesI',     name:'James I',     reignStart:1603, reignEnd:1625,  img:'/images/jamesI-portrait.jpg' },
  { id:'charlesI',   name:'Charles I',   reignStart:1625, reignEnd:1649,  img:'/images/charlesI-portrait.jpg' },
  // Interregnum
  { id:'oliverCromwell',   name:'Oliver Cromwell',   reignStart:1653, reignEnd:1658,  img:'/images/oliverCromwell-portrait.jpg' },
  { id:'richardCromwell',  name:'Richard Cromwell',  reignStart:1658, reignEnd:1659,  img:'/images/richardCromwell-portrait.jpg' },
  // Stuart restored
  { id:'charlesII',  name:'Charles II',  reignStart:1660, reignEnd:1685,  img:'/images/charlesII-portrait.jpg' },
  { id:'jamesII',    name:'James II',    reignStart:1685, reignEnd:1688,  img:'/images/jamesII-portrait.jpg' },
  // William and Mary
  { id:'maryII',     name:'Mary II',     reignStart:1689, reignEnd:1694,  img:'/images/maryII-portrait.jpg' },
  { id:'williamIII', name:'William III', reignStart:1689, reignEnd:1702,  img:'/images/williamIII-portrait.jpg' },
  // Stuart restored (Anne)
  { id:'anne',       name:'Anne',        reignStart:1702, reignEnd:1714,  img:'/images/anne-portrait.jpg' },
  // Hanover
  { id:'georgeI',    name:'George I',    reignStart:1714, reignEnd:1727,  img:'/images/georgeI-portrait.jpg' },
  { id:'georgeII',   name:'George II',   reignStart:1727, reignEnd:1760,  img:'/images/georgeII-portrait.jpg' },
  { id:'georgeIII',  name:'George III',  reignStart:1760, reignEnd:1820,  img:'/images/georgeIII-portrait.jpg' }
];

if (typeof window !== 'undefined') window.MONARCHS = MONARCHS;
