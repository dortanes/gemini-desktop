class WebContentsViewStateManager {
  constructor() {
    this.currentState = 'detached'; // 'detached', 'main', 'mini', 'transitioning'
    this.targetState = null;
    this.transitionPromise = null;
    this.stateChangeListeners = [];
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Check if currently transitioning
   */
  isTransitioning() {
    return this.currentState === 'transitioning';
  }

  /**
   * Add state change listener
   */
  addStateChangeListener(listener) {
    this.stateChangeListeners.push(listener);
  }

  /**
   * Remove state change listener
   */
  removeStateChangeListener(listener) {
    const index = this.stateChangeListeners.indexOf(listener);
    if (index > -1) {
      this.stateChangeListeners.splice(index, 1);
    }
  }

  /**
   * Notify state change listeners
   */
  notifyStateChange(oldState, newState) {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(oldState, newState);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }

  /**
   * Set state with validation and notification
   */
  setState(newState) {
    const validStates = ['detached', 'main', 'mini', 'transitioning'];
    if (!validStates.includes(newState)) {
      throw new Error(`Invalid state: ${newState}`);
    }

    const oldState = this.currentState;
    if (oldState !== newState) {
      this.currentState = newState;
      console.log(`WebContentsView state changed: ${oldState} -> ${newState}`);
      this.notifyStateChange(oldState, newState);
    }
  }

  /**
   * Request state transition with queuing
   */
  async requestTransition(targetState, transitionFunction) {
    // If already in target state, no transition needed
    if (this.currentState === targetState) {
      console.log(`Already in target state: ${targetState}`);
      return true;
    }

    // If currently transitioning, wait for current transition to complete
    if (this.isTransitioning() && this.transitionPromise) {
      console.log(`Waiting for current transition to complete before transitioning to: ${targetState}`);
      await this.transitionPromise;
      
      // Check again if we're already in the target state after waiting
      if (this.currentState === targetState) {
        return true;
      }
    }

    // Start new transition
    this.targetState = targetState;
    this.setState('transitioning');

    this.transitionPromise = this.executeTransition(targetState, transitionFunction);
    
    try {
      const result = await this.transitionPromise;
      this.setState(targetState);
      return result;
    } catch (error) {
      console.error(`Transition to ${targetState} failed:`, error);
      this.setState('detached'); // Reset to safe state on error
      throw error;
    } finally {
      this.transitionPromise = null;
      this.targetState = null;
    }
  }

  /**
   * Execute the actual transition
   */
  async executeTransition(targetState, transitionFunction) {
    try {
      return await transitionFunction();
    } catch (error) {
      console.error(`Error during transition to ${targetState}:`, error);
      throw error;
    }
  }

  /**
   * Force reset state (for error recovery)
   */
  forceReset() {
    this.currentState = 'detached';
    this.targetState = null;
    this.transitionPromise = null;
    console.log('WebContentsView state forcefully reset to detached');
  }
}

module.exports = WebContentsViewStateManager;