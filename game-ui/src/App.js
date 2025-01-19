import React, { useState, useEffect, useRef, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Paper, Box, Button, TextField, Snackbar, Alert } from "@mui/material";
import { getSteamData, getGameDetails } from "./services/steam.service";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [data, setData] = useState([]); // Full game data
  const [isAllDataFetched, setIsAllDataFetched] = useState(false);
  const [hasMoreGames, setHasMoreGames] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 100,
  });
  const [steamId, setSteamId] = useState("");
  const fetchData = async (steamIdValue, page = 1) => {
    setIsLoading(true);
    try {
      const params = {
        steamid: steamIdValue,
        format: "json",
        page,
      };

      const response = await getSteamData(params);
      const newGames = response.games || [];

      if (page === 1) {
        // For the first page, replace data
        setData(newGames.slice(0, 20));
      } else {
        // Append data for subsequent pages
        setData((prevData) => {
          const existingIds = new Set(prevData.map((game) => game.appid));
          const filteredNewGames = newGames.filter((game) => !existingIds.has(game.appid));
          return [...prevData, ...filteredNewGames];
        });

        if (newGames.length === 0) {
          setHasMoreGames(false); // No more games to load
        }
      }
    } catch (error) {
      console.error("Error fetching game data:", error.message);
      if(error.response?.status === 404){
        setAlertMessage('Steam ID not found or the profile is private.')
        setAlertOpen(true);
      }else{
        setAlertMessage('An unexpected error occurred.')
        setAlertOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchData(steamId, currentPage + 1);
    setCurrentPage((prevPage) => prevPage + 1); // Increment page
  };

  const handleSteamIdChange = (e) => {
    setSteamId(e.target.value);
  };

  const handleSteamIdSubmit = () => {
    setCurrentPage(1); // Reset pagination
    setHasMoreGames(true); // Allow loading more games
    fetchData(steamId, 1); // Fetch data with new Steam ID
  };
  const rows = useMemo(() => {
    const { page, pageSize } = paginationModel;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;

    return data.slice(startIndex, endIndex).map((game) => ({
      id: game.appid,
      name: game.name,
      img_icon_url: game.img_icon_url,
      playtime_forever: game.playtime_forever,
      metacritic: game.metacritic || "--", // Placeholder, update if needed
      main_time: game.main_time,
    }));
  }, [data, paginationModel]);
  const rowCount = useMemo(() => data.length, [data]);
  const handleAlertClose = () => {
    setAlertOpen(false); // Close alert
  };
  const columns = [
    {
      field: "image",
      headerName: "",
      width: 100,
      renderCell: (params) => (
        <img
          src={`https://media.steampowered.com/steamcommunity/public/images/apps/${params.row.id}/${params.row.img_icon_url}.jpg`}
          //src={params.row.capsule_image}
          alt={params.row.name}
          style={{ width: 50, height: 50 }}
        />
      ),
      sortable: false,
    },
    { field: "name", headerName: "Game", width: 200 },
    {
      field: "metacritic",
      headerName: "Metacritic score",
      width:150,
      sortComparator:(v1, v2)=>{
        const score1 = v1 === '--' ? -Infinity : Number(v1);
        const score2 = v2 === '--' ? -Infinity : Number(v2);
        return score1 - score2;
      },
      renderCell: (params) => {
        const score = params.value;

        let backgroundColor = "";
        if (score >= 80) {
          backgroundColor = "rgba(0, 128, 0, 0.2)";
        } else if (score >= 69) {
          backgroundColor = "rgba(255, 165, 0, 0.2)";
        } else {
          backgroundColor = "rgba(255, 0, 0, 0.2)";
        }

        return (
          <div
            style={{
              backgroundColor,
              color: "black",
              borderRadius: "4px",
              padding: "5px",
              textAlign: "center",
              width: "100%", 
              height: "100%", 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            {score}
          </div>
        );
      },
    },
    {
      field: "playtime_forever",
      headerName: "Played Time (minutes)",
      width: 200,
      align: "right",
    },

    {
      field: "main_time",
      headerName: "Main Story",
      align: "right",
    },
  ];

  return (
    <Box sx={{ height: 800, width: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <TextField
          label="Steam ID"
          variant="outlined"
          value={steamId}
          onChange={handleSteamIdChange}
          sx={{ flex: 1 }}
        />
        <Button variant="contained" onClick={handleSteamIdSubmit} disabled={isLoading}>
          Fetch Games
        </Button>
      </Box>
    <Paper style={{ height: 800, width: "100%" }}>
      <DataGrid
        rows={rows} // Dynamically sliced rows
        columns={columns}
        rowCount={rowCount} // Total rows in data
        loading={isLoading}
        paginationMode="client" // Client-side pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel} // Handles changes in page and pageSize
        pageSizeOptions={[5, 10, 25,100]} // Page size options
        hideFooterPagination='true'
      />
    </Paper>
    <Box sx={{ p: 2, textAlign: "center" }}>
        {hasMoreGames && (
          <Button variant="contained" onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More Games"}
          </Button>
        )}
        {!hasMoreGames && <p>No more games to load.</p>}
      </Box>
      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose}>
        <Alert onClose={handleAlertClose} severity="error" sx={{ width: "100%" }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
