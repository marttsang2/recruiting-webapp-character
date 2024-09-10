import { useEffect, useState } from 'react';
import './App.css';
import { ATTRIBUTE_LIST, CLASS_LIST, SKILL_LIST, MAX_ATTRIBUTE_VALUE } from './consts.js';

function App() {
  const [characters, setCharacters] = useState([{
    attributes: Object.fromEntries(ATTRIBUTE_LIST.map(attr => [attr, 10])),
    skills: Object.fromEntries(SKILL_LIST.map(skill => [skill.name, 0])),
    class: null,
    skillChecks: null,
  }]);
  const [partySkillCheck, setPartySkillCheck] = useState({
    skill: SKILL_LIST[0].name,
    dc: 1,
    result: null,
    randomNumber: null,
    total: null,
    maxSkillPoints: null,
    characterIndex: null,
  });
  const [currentSkillCheck, setCurrentSkillCheck] = useState({
    skill: SKILL_LIST[0].name,
    dc: 1,
  });

  useEffect(() => {
    handleFetchData();
  }, []);

  const handleFetchData = async () => {
    try {
      const response = await fetch('https://recruiting.verylongdomaintotestwith.ca/api/marttsang2/character');
      const data = await response.json();
      const { characters, partySkillCheck, currentSkillCheck } = data.body;
      if (!data.body || !characters || !partySkillCheck || !currentSkillCheck) {
        return;
      }
      console.log(characters, partySkillCheck, currentSkillCheck);
      setCharacters(characters);
      setPartySkillCheck(partySkillCheck);
      setCurrentSkillCheck(currentSkillCheck);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  const handleSaveData = async () => {
    try {
      const response = await fetch('https://recruiting.verylongdomaintotestwith.ca/api/marttsang2/character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ characters, partySkillCheck, currentSkillCheck }),
      });
      if (response.ok) {
        alert('Data saved');
      } else {
        alert('Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data');
    }
  }

  const calculateAvailableSkillPoints = (attributes, skills) => {
    const intelligenceModifier = Math.floor((attributes.Intelligence - 10) / 2);
    const totalPoints = 10 + (4 * intelligenceModifier);
    const spentPoints = Object.values(skills).reduce((sum, points) => sum + points, 0);
    return totalPoints - spentPoints;
  };

  const calculateSkillModifier = (attributes, skill) => {
    const attributeModifier = SKILL_LIST.find(s => s.name === skill)?.attributeModifier;
    return Math.floor((attributes[attributeModifier] - 10) / 2);
  };

  const handleAddNewCharacter = () => {
    setCharacters(prev => [...prev, {
      attributes: Object.fromEntries(ATTRIBUTE_LIST.map(attr => [attr, 10])),
      skills: Object.fromEntries(SKILL_LIST.map(skill => [skill.name, 0])),
      class: null,
      skillChecks: null,
    }]);
    alert('New character added');
  }

  const handleResetAllCharacters = () => {
    setCharacters([{
      attributes: Object.fromEntries(ATTRIBUTE_LIST.map(attr => [attr, 10])),
      skills: Object.fromEntries(SKILL_LIST.map(skill => [skill.name, 0])),
      class: null,
      skillChecks: null,
    }]);
    alert('All characters reset');
  }

  const handleAttributeChange = (characterIndex, attribute, value) => {
    setCharacters(prev => {
      const newCharacters = [...prev];
      const sumOfAttributes = Object.values(newCharacters[characterIndex].attributes).reduce((sum, val) => sum + val, 0);
      if (sumOfAttributes + value > MAX_ATTRIBUTE_VALUE) {
        alert(`You can only spend ${MAX_ATTRIBUTE_VALUE} attribute points`);
        return prev;
      }
      newCharacters[characterIndex] = {
        ...newCharacters[characterIndex],
        attributes: {
          ...newCharacters[characterIndex].attributes,
          [attribute]: newCharacters[characterIndex].attributes[attribute] + value
        }
      };
      return newCharacters;
    });
  }

  const handleSkillChange = (characterIndex, skillName, value) => {
    setCharacters(prev => {
      const newCharacters = [...prev];
      const character = newCharacters[characterIndex];
      const availablePoints = calculateAvailableSkillPoints(character.attributes, character.skills);
      if (value > 0 && value > availablePoints) {
        alert(`You can only spend ${availablePoints} more skill points`);
        return prev;
      }
      newCharacters[characterIndex] = {
        ...character,
        skills: {
          ...character.skills,
          [skillName]: Math.max(0, character.skills[skillName] + value)
        }
      };
      return newCharacters;
    });
  };

  const handleClassSelection = (characterIndex, classTitle) => {
    setCharacters(prev => {
      const newCharacters = [...prev];
      newCharacters[characterIndex] = {
        ...newCharacters[characterIndex],
        class: classTitle
      };
      return newCharacters;
    });
  };

  const handleClassMinRequirements = (attributes, classTitle) => {
    const classRequirements = CLASS_LIST[classTitle];
    return Object.entries(classRequirements).every(([attr, value]) => attributes[attr] >= value);
  };

  const calculateSkillCheck = (skillPoints, skill, dc) => {
    const randomNumber = Math.floor(Math.random() * 20) + 1;
    const total = skillPoints + randomNumber;
    const result = {
      skill,
      dc,
      result: total >= dc,
      randomNumber,
      total
    }
    return result;
  }

  const handleSkillCheck = (characterIndex) => {
    const { skill, dc } = currentSkillCheck;
    if (!skill || !dc) {
      alert('Please select a skill and set a DC');
      return;
    }
    setCharacters(prev => {
      const newCharacters = [...prev];
      const character = newCharacters[characterIndex];
      const result = calculateSkillCheck(character.skills[skill], skill, dc);
      newCharacters[characterIndex] = {
        ...character,
        skillChecks: result
      };
      return newCharacters;
    });
  };

  const handlePartySkillCheck = () => {
    const { skill, dc } = partySkillCheck;
    let maxSkillPoints = 0;
    let characterIndex = 0;
    characters.forEach((character, index) => {
      const skillPoints = character.skills[skill];
      if (skillPoints > maxSkillPoints) {
        maxSkillPoints = skillPoints;
        characterIndex = index;
      }
    })
    const { result, randomNumber, total } = calculateSkillCheck(maxSkillPoints, skill, dc);
    setPartySkillCheck({
      skill,
      maxSkillPoints,
      dc,
      result,
      randomNumber,
      total,
      characterIndex,
    })
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Coding Exercise</h1>
      </header>
      <section className="App-section">
        <div className='App-wrapper'>
          <button type='button' onClick={handleAddNewCharacter}>Add New Character</button>
          <button type='button' onClick={handleResetAllCharacters}>Reset All Characters</button>
          <button type='button' onClick={handleSaveData}>Save All Characters</button>
        </div>
        <div>
          <h1>** Party Skill Check **</h1>
          <div>
            <label>Skill: </label>
            <select 
              name='skill' 
              value={partySkillCheck.skill}
              onChange={(e) => setPartySkillCheck(prev => ({ ...prev, skill: e.target.value }))}
            >
              {SKILL_LIST.map((skill) => (
                <option key={skill.name} value={skill.name}>{skill.name}</option>
              ))}
            </select>
            <label>DC: </label>
            <input 
              name='dc' 
              type='number' 
              value={partySkillCheck.dc} 
              min='1' 
              max='20' 
              onChange={(e) => setPartySkillCheck(prev => ({ ...prev, dc: parseInt(e.target.value) }))} 
            />
            <button type='button' onClick={handlePartySkillCheck}>Roll</button>
          </div>
          {partySkillCheck?.result !== null && (
            <div>
              <p>Selected Character: {partySkillCheck.characterIndex + 1}</p>
              <p>Skill: {partySkillCheck.skill}: {partySkillCheck.maxSkillPoints}</p>
              <p>DC: {partySkillCheck.dc}</p>
              <p>Random Number: {partySkillCheck.randomNumber}</p>
              <p>Total: {partySkillCheck.total}</p>
              <p>Result: {partySkillCheck.result ? 'Successful' : 'Failure'}</p>
            </div>
          )}
        </div>
        <div>
          {characters?.map((character, characterIndex) => (
            <div key={characterIndex}>
              <h1>Character {characterIndex + 1}</h1>
              <div>
                <h1>Skill Check</h1>
                <div>
                  <label>Skill: </label>
                  <select name='skill'
                    value={currentSkillCheck.skill}
                    onChange={(event) => setCurrentSkillCheck({ ...currentSkillCheck, skill: event.target.value })}>
                    {SKILL_LIST.map((skill) => (
                      <option key={skill.name} value={skill.name}>{skill.name}</option>
                    ))}
                  </select>
                  <label>DC: </label>
                  <input 
                    name='dc' 
                    type='number' 
                    value={currentSkillCheck.dc} 
                    min='1' 
                    max='20' 
                    onChange={(event) => setCurrentSkillCheck({ ...currentSkillCheck, dc: parseInt(event.target.value) })} 
                  />
                  <button type='button' onClick={() => handleSkillCheck(characterIndex)}>Roll</button>
                </div>
              </div>
              {character.skillChecks && (
                <div>
                  <h2>Skill Check Result</h2>
                  <p>Skill: {character.skillChecks.skill}: {character.skills[character.skillChecks.skill]}</p>
                  <p>You Rolled: {character.skillChecks.randomNumber}</p>
                  <p>DC: {character.skillChecks.dc}</p>
                  <p>Total: {character.skillChecks.total}</p>
                  <p>Result: {character.skillChecks.result ? 'Successful' : 'Failure'}</p>
                </div>
              )}
              <div className="App-wrapper">
                <div>
                  <h4>Attributes</h4>
                  {Object.entries(character.attributes).map(([attr, value]) => (
                    <div key={attr}>
                      {attr}: {value} (Modifier: {Math.floor((value - 10) / 2)})
                      <button onClick={() => handleAttributeChange(characterIndex, attr, 1)}>+</button>
                      <button onClick={() => handleAttributeChange(characterIndex, attr, -1)}>-</button>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 onClick={() => handleClassSelection(characterIndex, '')}>Classes</h4>
                  {Object.keys(CLASS_LIST).map((classTitle) => (
                    <p
                      key={classTitle}
                      className={handleClassMinRequirements(character.attributes, classTitle) ? 'App-class' : ''}
                      onClick={() => handleClassSelection(characterIndex, classTitle)}
                    >
                      {classTitle}
                    </p>
                  ))}
                </div>
                {character.class && (
                  <div>
                    <h4>{character.class} Minimum Requirements</h4>
                    {Object.entries(CLASS_LIST[character.class]).map(([attr, value]) => (
                      <div key={attr}>
                        {attr}: {value}
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <h4>Skills</h4>
                  <p>Total Skill Points: {calculateAvailableSkillPoints(character.attributes, character.skills)}</p>
                  {SKILL_LIST.map((skill) => (
                    <div key={skill.name}>
                      {skill.name} - points: {character.skills[skill.name]} [+] [-] 
                      modifier ({skill.attributeModifier}): {calculateSkillModifier(character.attributes, skill.name)}
                      <button onClick={() => handleSkillChange(characterIndex, skill.name, 1)}>+</button>
                      <button onClick={() => handleSkillChange(characterIndex, skill.name, -1)}>-</button>
                      total: {character.skills[skill.name] + calculateSkillModifier(character.attributes, skill.name)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
