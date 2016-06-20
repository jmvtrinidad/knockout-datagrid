using System.Collections.Generic;

public class DataGridRequest<T> : DataGridRequest
{
    /// <summary>
    /// Gets global search.
    /// To be applied to all searchable columns.
    /// </summary>
    public T Search { get; set; }
}

public class DataGridRequest
{
    /// <summary>
    /// This is to ensure server-side procesing request are drawn in sequence.
    /// </summary>
    public int Draw { get; set; }

    /// <summary>
    /// This is the start point in the current data set (zero index based).
    /// </summary>
    public int Start { get; set; }

    /// <summary>
    /// Gets the number of records that the table can display in the current draw.
    /// It is expected that the number of records returned will be equal to this number, unless the server has fewer records to return.
    /// Note that this can be -1 to indicate that all records should be returned (although that negates any benefits of server-side processing!).
    /// Depending on query that used.
    /// </summary>
    public int Length { get; set; }

    public int PageNo { get { return (Start / Length) + 1; } }

    public int TotalRows { get; set; }
}


public class DataGridResponse<T>
{
    public DataGridResponse(IEnumerable<T> data, DataGridRequest request)
    {
        Data = data;
        Draw = request.Draw;
        RecordsTotal = request.TotalRows;
        RecordsFiltered = request.TotalRows;
    }

    public IEnumerable<T> Data { get; set; }

    public int Draw { get; set; }

    public int RecordsFiltered { get; set; }

    public int RecordsTotal { get; set; }
}
