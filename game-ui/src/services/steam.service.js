const API_BASE_URL = 'http://localhost:3001/api/';

const toQueryString = (params) => {
    return params
      ? '?' +
          Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&')
      : '';
  };
export const getSteamData = async (params={}, options ={})=>{
    const queryString = toQueryString(params);
    const url = `${API_BASE_URL}steam${queryString}`;
    try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        if (!response.ok) {
          throw new Error(`Failed to fetch Steam data: ${response.statusText}`);
        }
    
        return await response.json();
      } catch (error) {
        console.error('Error fetching Steam data:', error.message);
        throw error;
      }
};

export const getGameDetails = async (params={}, options={})=>{
    const url = `${API_BASE_URL}gameDetails?appids=${params}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch Steam data: ${response.statusText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching Steam data:', error.message);
      throw error;
    }
};