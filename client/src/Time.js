import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { LineChart } from 'react-chartkick';
import 'chart.js';

import { SESSION_TIMES, DELETE_TIME, DELETE_TIMES, DNF_TIME, ADD_TIME } from './queries';
import { adder } from './scrambleGens';
import Cube from './Cube';

export default function Time(props) {
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [active, setActive] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [selectedOption, setSelectedOption] = useState('Graph');

  // THE GRAPHQL QUERIES/MUTATIONS NEEDED ON THIS PAGE //
  const {loading, error, data} = useQuery(SESSION_TIMES, {variables: {userId: props.user._id, session: sessionId } });
  const [deleteTime] = useMutation(DELETE_TIME);
  const [deleteTimes] = useMutation(DELETE_TIMES);
  const [dnfTime] = useMutation(DNF_TIME);
  const [addTime] = useMutation(ADD_TIME);

  //TODO: Make it so that default selected session is 3x3 using SESSION query

  function getUnits() { // Function for converting the stored time to something that makes far more sense
    const seconds = time / 1000;
    return {
      min: Math.floor(seconds / 60).toString(),
      sec: Math.floor(seconds % 60).toString(),
      msec: (seconds % 1).toFixed(2).substring(2)
    }
  }

  useEffect( () => { // When the props' sessionId changes this one will update too
    setSessionId(props.sessionId)
  }, [props.sessionId])

  useEffect( () => { // Checks if (active) and will set an interval if it is
    if (active) {
      var int = setInterval(update, 10)
    }
    return () => {
      clearInterval(int)
    }
  }, [active])

  useEffect( () => { // Sets the start time whenever {active} changes 
    setStartTime(Date.now())
  }, [active])

  function update() { // Updates the displayed time
    let current = Date.now() - startTime
    setTime(time + current)
    setStartTime(Date.now())
  }

  let timer = (e) => { // Will start/stop the timer given that the spacebar is released
    if (e.key === ' ' && !active || e.target.value === 'time' && !active) {
      setTime(0)
      setStartTime(Date.now())
      setActive(true)
    } else if (e.key === ' ' && active || e.target.value === 'time' && active) {
      setActive(false)
      let endTime = getUnits()
      addTime({
        variables: {
          userId: props.user._id,
          session: props.sessionId,
          time: endTime.min + ':' + endTime.sec + '.' + endTime.msec
        },
        refetchQueries: [{query: SESSION_TIMES, variables: {userId: props.user._id, session: props.sessionId } }]
      })
      props.newScramble()
    }
  }

  useEffect( () => {
    let eatSpaceBar = (e) => { // So that the window doesn't scroll down or any other things that the space bar might do
      if (e.keyCode === 32) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', eatSpaceBar)
    window.addEventListener('keyup', timer)
    return () => {
      window.removeEventListener('keydown', eatSpaceBar)
      window.removeEventListener('keyup', timer)
    }
  })

  if (loading) {
    return <h4>Loading...</h4>
  }
  if (error) {
    return <h3 style={{color: 'red'}}>Select a type from above</h3>
  }

  let handleDelTime = (e, id) => {
    e.preventDefault()
    deleteTime({
      variables: {
      timeId: id
      },
      refetchQueries: [{query: SESSION_TIMES, variables: {userId: props.user._id, session: props.sessionId } }]
    })
  }

  let handleDelTimes = (e) => {
    e.preventDefault()
    deleteTimes({
      variables: {
        userId: props.user._id,
        session: props.sessionId
      },
      refetchQueries: [{query: SESSION_TIMES, variables: {userId: props.user._id, session: props.sessionId } }]
    })
  }

  let handleDnfTime = (e, id) => {
    e.preventDefault()
    dnfTime({
      variables: {
        timeId: id
      }, 
      refetchQueries: [{query: SESSION_TIMES, variables: {userId: props.user._id, session: props.sessionId } }]
    })
  }

  var result = {};
  var count = 1
  for (var i = 0; i < data.sessionTimes.length; i++) {
    result[count] = data.sessionTimes[i].time;
    count++
  }

  let content;
  if (selectedOption === 'Graph') {
    content = <LineChart xtitle="Solve Number" ytitle="Time(min)" data={result} />
  } else {
    content = <Cube scramble={props.scramble} />
  }

  let averages;
  if (data.sessionTimes.length < 5 && !active) {
    averages = (
      <div className="App">
        <h2>Average of 5: ---</h2>
        <h2>Average of 12: ---</h2>
      </div>
    )
  } else if (data.sessionTimes.length >= 5 && data.sessionTimes.length < 12 && !active) {
    let section = [...data.sessionTimes].splice(data.sessionTimes.length - 5, data.sessionTimes.length - 1)
    let total = adder(section)
    if (!total) {
      averages = (
        <div className="App">
          <h2>Average of 5: ---</h2>
          <h2>Average of 12: ---</h2>
        </div>
      )
    } else {
    averages = (
      <div className="App">
        <h2>Average of 5: {(total / 5).toFixed(2)}</h2>
        <h2>Average of 12: ---</h2>
      </div>
    )
    }
  } else if (data.sessionTimes.length > 12 && !active) {
    let section5 = [...data.sessionTimes].splice(data.sessionTimes.length - 5, data.sessionTimes.length - 1)
    let section12 = [...data.sessionTimes].splice(data.sessionTimes.length - 12, data.sessionTimes.length - 1)
    let total5 = adder(section5)
    let total12 = adder(section12)
    if (!total5 || !total12) {
      averages = (
        <div className="App">
          <h2>Average of 5: ---</h2>
          <h2>Average of 12: ---</h2>
        </div>
      )
    } else {
      averages = (
        <div className="App">
          <h2>Average of 5: {(total5 / 5).toFixed(2)}</h2>
          <h2>Average of 12: {(total12 / 12).toFixed(2)}</h2>
        </div>
      )
    }
  }

  let mobileTimer;
  if (props.mobile) {
    mobileTimer = ( <button className="start-stop" value="time" onClick={(e) => timer(e)}>{active ? 'Stop' : 'Start'}</button>)
  } else {
    mobileTimer = ''
  }
  let units = getUnits();
  return (
    <div className="left-aside">
      <h1 className="timer">{units.min}:{units.sec}.{units.msec}</h1>
      {averages}
      {mobileTimer}
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Delete</th>
            <th>DNF</th>
          </tr>
        </thead>
        <tbody>
          {data.sessionTimes.map((time, id) => <tr key={id}><td>{time.dnf ? "DNF" : time.time}</td><td className="pointer" onClick={ (e) => handleDelTime(e, time.id)}>X</td><td className="pointer" onClick={ (e) => handleDnfTime(e, time.id)}>DNF</td></tr>)}
        </tbody>
      </table>
      <div className="div-button" onClick={handleDelTimes}>Delete All Times</div>
      <hr />
      <div className="graph">
        <select name="cube-or-graph" onChange={(e) => setSelectedOption(e.target.value)}>
          <option value="Graph" defaultValue>Graph</option>
          <option value="Cube">Draw Scramble</option>
        </select>
        {content}
      </div>
    </div>
  )
}
