import React, { useState, useEffect, useRef, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Paper } from "@mui/material";
import { getSteamData, getGameDetails } from "./services/steam.service";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [data, setData] = useState([]); // Full game data
  const [isAllDataFetched, setIsAllDataFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 10,
  });
  useEffect(() => {
    const fetchAllData = async () => {
      let page = 1;
      let shouldFetch = true;

      setIsLoading(true);

      while (shouldFetch) {
        try {
          const params = {
            steamid: "76561198095181799",
            format: "json",
            page
          };
          const response = await getSteamData(params);
          const newGames = response.games || [];

          if (newGames.length === 0) {
            shouldFetch = false;
          } else {
            setData((prevData) => {
              const existingIds = new Set(prevData.map((game) => game.appid));
              const filteredNewGames = newGames.filter((game) => !existingIds.has(game.appid));
              return [...prevData, ...filteredNewGames];
            });
            console.log(data);
            page += 1; 
            await sleep(2000);
          }
        } catch (error) {
          console.error("Error fetching game data:", error.message);
          shouldFetch = false;
        }
      }
      console.log(data);
      setIsAllDataFetched(true);
      setIsLoading(false);
    };

    fetchAllData();
  }, []);
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
    }));
  }, [data, paginationModel]);
  const rowCount = useMemo(() => data.length, [data]);
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
      width: 200,
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
  ];

  return (
    <Paper style={{ height: 800, width: "100%" }}>
      <DataGrid
        rows={rows} // Dynamically sliced rows
        columns={columns}
        rowCount={rowCount} // Total rows in data
        loading={isLoading || !isAllDataFetched}
        paginationMode="client" // Client-side pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel} // Handles changes in page and pageSize
        pageSizeOptions={[5, 10, 25]} // Page size options
      />
    </Paper>
  );
}

export default App;
